// 3D-visare för artiklar. Bygger geometri från den parametriska modellen
// (axel/platta/bussning) eller renderar en uppladdad STL. OrbitControls
// för rotation/zoom.

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import type { PartModel } from '../lib/partModel';
import { materialColor, modelBounds } from '../lib/partModel';

interface Props {
  model?: PartModel;
  stlData?: string;
  materialName?: string;
  height?: number;
}

function buildParametric(model: PartModel, mat: THREE.Material): THREE.Group {
  const group = new THREE.Group();

  if (model.kind === 'shaft') {
    let x = 0;
    const total = model.segments.reduce((s, seg) => s + seg.length, 0);
    model.segments.forEach((seg, i) => {
      const geo = new THREE.CylinderGeometry(seg.diameter / 2, seg.diameter / 2, seg.length, 48);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.z = Math.PI / 2;
      mesh.position.x = x + seg.length / 2 - total / 2;
      group.add(mesh);
      // Kilspår: mörkare spår fräst i mantelytan
      const kw = model.keyway;
      if (kw && kw.segmentIndex === i) {
        const depth = Math.min(kw.width * 0.6, seg.diameter * 0.25);
        const box = new THREE.BoxGeometry(kw.length, depth, kw.width);
        const slot = new THREE.Mesh(
          box,
          new THREE.MeshStandardMaterial({ color: 0x3a4450, metalness: 0.5, roughness: 0.7 }),
        );
        slot.position.set(
          x + kw.offset + kw.length / 2 - total / 2,
          seg.diameter / 2 - depth / 2 + 0.05,
          0,
        );
        group.add(slot);
      }
      x += seg.length;
    });
  } else if (model.kind === 'plate') {
    const shape = new THREE.Shape();
    const w = model.width;
    const d = model.depth;
    shape.moveTo(-w / 2, -d / 2);
    shape.lineTo(w / 2, -d / 2);
    shape.lineTo(w / 2, d / 2);
    shape.lineTo(-w / 2, d / 2);
    shape.closePath();
    for (const hole of model.holes) {
      const path = new THREE.Path();
      path.absarc(hole.x, hole.y, hole.diameter / 2, 0, Math.PI * 2, true);
      shape.holes.push(path);
    }
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: model.thickness,
      bevelEnabled: false,
      curveSegments: 32,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2; // platt på "bordet"
    mesh.position.y = -model.thickness / 2;
    group.add(mesh);
  } else {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, model.outerDiameter / 2, 0, Math.PI * 2, false);
    const bore = new THREE.Path();
    bore.absarc(0, 0, model.innerDiameter / 2, 0, Math.PI * 2, true);
    shape.holes.push(bore);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: model.length,
      bevelEnabled: false,
      curveSegments: 48,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.y = Math.PI / 2; // axel längs x
    mesh.position.x = -model.length / 2;
    group.add(mesh);
  }

  return group;
}

export default function Viewer3D({ model, stlData, materialName, height = 360 }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || (!model && !stlData)) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f3f6);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, height);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(1, 2, 1.5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-1.5, -0.5, -1);
    scene.add(fill);

    const mat = new THREE.MeshStandardMaterial({
      color: materialColor(materialName),
      metalness: 0.65,
      roughness: 0.35,
    });

    const camera = new THREE.PerspectiveCamera(40, mount.clientWidth / height, 1, 5000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    let disposed = false;
    let frame = 0;

    const fitCamera = (maxDim: number) => {
      const dist = maxDim * 1.9;
      camera.position.set(dist * 0.8, dist * 0.55, dist * 0.8);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      const grid = new THREE.GridHelper(maxDim * 2.5, 10, 0xb9c3cc, 0xdbe2e8);
      grid.position.y = -maxDim * 0.65;
      scene.add(grid);
    };

    if (stlData) {
      fetch(stlData)
        .then((r) => r.arrayBuffer())
        .then((buf) => {
          if (disposed) return;
          const geo = new STLLoader().parse(buf);
          geo.center();
          geo.computeVertexNormals();
          const mesh = new THREE.Mesh(geo, mat);
          scene.add(mesh);
          geo.computeBoundingSphere();
          fitCamera((geo.boundingSphere?.radius ?? 50) * 1.4);
        })
        .catch(() => {
          /* trasig STL — vyn förblir tom */
        });
    } else if (model) {
      scene.add(buildParametric(model, mat));
      const b = modelBounds(model);
      fitCamera(Math.max(b.w, b.h, b.d));
    }

    const animate = () => {
      frame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, height);
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [model, stlData, materialName, height]);

  if (!model && !stlData) {
    return (
      <div className="empty-state" style={{ height }}>
        Ingen 3D-modell definierad för artikeln ännu.
      </div>
    );
  }

  return <div ref={mountRef} className="viewer3d" style={{ height }} />;
}
