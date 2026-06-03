import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const MAP_TEXTURE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAACAAQAAAADMzoqnAAAECklEQVR42u3VsW4jRRzH8d94gzfF4Q0VQaC4vBLTRTp0mze4ggfAPAE5XQEFsGNAVIjwBrmW7h7gJE+giKjyABTZE4g06LKJETdRJvtD65kdz6yduKABiW+TVfzRf2bXYxtcE/59YJCz6YdbgQF6ACSRrwYKYImmh5PbwOewlV3wlQNbAN6SEExjUOO+BU0aCSnxReHABUlK4YFQeJeUT3da8IIkZ6NGoSnFY5KsMoVzMKfECUnqxgPYRArarmUCndHwzIEaQEpg5xVdBXROl8mpAQx5dUgPiHoYAAkg5w3JABR06byGAVgcRGAz5bznj6phBQNRFwyqgdxebH6gshJAesWoFhgYpApAFoG8BIZ/fEhSox5jDjQXmV0Ar5XJfAIrALi3URVs09gHIL4XJCkLC5LH9JWiArABFCSrQjdgkBzRJ0WJeUOSNyQAfJJwUSWUBRlJQ8oGHATACGlBynnzy2kEYLNjrxouigD8BZcgOeVPqh12RtufaCN5wCPVDpvQ9lsIrqndsJtDcWqBCpf4hWN7OdWHBw58FwIaNOU/n1TpMW2DFaD48cmr4185T8NHkpUFX749pQPVdgRKC/DGoQPVeAEKv+WHvY8OOWNTPRp5kHuwSf8wzXtVBKR7YwEH9H3lQUaypUfSATOALyVNu5vZJW31Bnx98nkLfDUWJaz6ixvm+RIQRdl3kmRxxiaDoGnZW4CpPfkaQadlcPim1xOSvETQo7Lv75enVAXJ3xGUlony4KQBBWUM1NiDc6qhyS8RgQs18OCMMtPDaAUIyg0PZkRWDqs+wnKJBTDI1Js6BolegOsKmUxNDBAAKqQyMQmidhegBlLZ+wwKYdv5M/8x1khkb1cgKqP2H+MKyV5vS+whrE8DQDgAlUAoRBX056EElJCjJVACeJBZgNfVp+iCCm4RBWCgKsRxASSA9KgDhDtCiTuMyfHsKXzhC6wNAIjjWb8LKAOA2ctk3FmCOlgKFy8f1N0JJtgsxinYnVAHt4t3gPzZXSCTyCWCQmBT91QE3B5yarSN40dNHYPka4TlDhTUI8zLvl0JSL3vZn6DsCFZOeB2yROEpR68sECQQA++xIGCR2X7DwlEoLRgUrZrqlUg50S1uy43YqDcN6UFBVkhAjWiCV2Q0jgQPdplMKxvBXodcOfAwJYvgdL+1etA1YJJfBcZlQV7sO1i2gHoNiyxtQ5sBsCgWyoxCHiFFd2L5nUTCqMAqGUgsQ9f5kCcCiZgRYkMgMTd5WsB1rTzj0Em14BE4r+QxN1lCEsVur2PoF5Wbg8RJXR4djgvBgauhLywoEZQrt1KKRdVS4CdlJ8qafyP+9KIj/nE/d7kKwH9jgS72e9DV+kvfTWgct4ZyP8Byb8BPG7MaaIIkAQAAAAASUVORK5CYII=';

const markerData = [
  { id: 'hanoi', name: 'HÀ NỘI', lat: 21.0285, lon: 105.8542 },
  { id: 'saigon', name: 'TP. HỒ CHÍ MINH', lat: 10.8231, lon: 106.6297 },
  { id: 'hoangsa', name: 'HOÀNG SA', lat: 16.5, lon: 112.0 },
  { id: 'truongsa', name: 'TRƯỜNG SA', lat: 10.0, lon: 114.5 }
];

const ALIGN_OFFSET = Math.PI / 2;

const Globe = () => {
  const mountRef = useRef(null);
  const [labels, setLabels] = useState([]);
  const globeGroupRef = useRef();

  useEffect(() => {
    const scene = new THREE.Scene();
    // 🌟 KHẮC PHỤC 1: Tỉ lệ camera động theo khung hình
    const camera = new THREE.PerspectiveCamera(40, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Tối ưu mobile không bị lag
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // Liquid Glass Core
    const glassSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.98, 64, 64),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 1.5,
        thickness: 1.5,
        roughness: 1,
        ior: 1.45,
        clearcoat: 1.0,
        transparent: true,
      })
    );
    globeGroup.add(glassSphere);

    // Ánh sáng
    const light1 = new THREE.SpotLight(0xffffff, 15);
    light1.position.set(2, 5, 5);
    scene.add(light1);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    // Point Cloud
    const earthTexture = new THREE.TextureLoader().load(MAP_TEXTURE_BASE64);
    const geometry = new THREE.BufferGeometry();
    const amount = 60000;
    const positions = new Float32Array(amount * 3);
    const uvs = new Float32Array(amount * 2);
    for (let i = 0; i < amount; i++) {
      const phi = Math.acos(-1 + (2 * i) / amount);
      const theta = Math.sqrt(amount * Math.PI) * phi;
      positions[i * 3] = Math.cos(theta) * Math.sin(phi);
      positions[i * 3 + 1] = Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = Math.cos(phi);
      uvs[i * 2] = 0.5 + (Math.atan2(positions[i * 3], positions[i * 3 + 2]) / (2 * Math.PI));
      uvs[i * 2 + 1] = 0.5 + (Math.asin(positions[i * 3 + 1]) / Math.PI);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    const material = new THREE.ShaderMaterial({
      uniforms: { uTexture: { value: earthTexture } },
      vertexShader: `
        varying vec2 vUv;
        varying float vVisible;
        void main() {
          vUv = uv;
          vec3 worldNormal = normalize(vec3(modelMatrix * vec4(position, 0.0)));
          vec3 viewDir = normalize(cameraPosition - vec3(modelMatrix * vec4(position, 1.0)));
          vVisible = dot(worldNormal, viewDir);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = clamp(2.5 * (3.0 / -mvPos.z), 1.0, 4.0);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying float vVisible;
        uniform sampler2D uTexture;
        void main() {
          if (vVisible < 0.1) discard;
          if (length(gl_PointCoord - 0.5) > 0.5) discard;
          float isLand = texture2D(uTexture, vUv).r;
          float alpha = (isLand > 0.5 ? 0.9 : 0.05) * smoothstep(0.1, 0.4, vVisible);
          gl_FragColor = vec4(isLand > 0.5 ? vec3(0.1) : vec3(0.8), alpha);
        }
      `,
      transparent: true,
    });
    globeGroup.add(new THREE.Points(geometry, material));

    // Markers
    const convertTo3D = (lat, lon, radius = 1.01) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon * Math.PI / 180) + ALIGN_OFFSET;
      return new THREE.Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
    };

    const markers = markerData.map(data => {
      const pos = convertTo3D(data.lat, data.lon);
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.015, 16, 16), new THREE.MeshBasicMaterial({ color: 0x007bff }));
      mesh.position.copy(pos);
      globeGroup.add(mesh);
      return { ...data, pos, mesh };
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.enableZoom = false;

    // 🌟 KHẮC PHỤC 2: Hàm xử lý Responsive khi thay đổi kích thước
    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();

      const cameraPos = camera.position.clone().normalize();
      const newLabels = markers.map(m => {
        const worldPos = m.pos.clone().applyMatrix4(globeGroup.matrixWorld);
        const dot = worldPos.clone().normalize().dot(cameraPos);
        const isVisible = dot > 0.25;
        m.mesh.visible = isVisible;
        const vector = worldPos.project(camera);
        const x = (vector.x * 0.5 + 0.5) * mountRef.current.clientWidth;
        const y = (-(vector.y * 0.5 - 0.5)) * mountRef.current.clientHeight;
        return { ...m, x, y, visible: isVisible };
      });
      setLabels(newLabels);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      scene.clear(); renderer.dispose();
    };
  }, []);

  return (
    // 🌟 KHẮC PHỤC 3: Đảm bảo container luôn center và không bị tràn
    <div style={{ width: '100%', maxWidth: '500px', aspectRatio: '1/1', margin: '0 auto', position: 'relative', overflow: 'visible' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />
      {labels.map(label => (
        <div key={label.id} style={{
          position: 'absolute', left: label.x, top: label.y, display: label.visible ? 'block' : 'none',
          transform: 'translate(-50%, -150%)', background: 'rgba(255,255,255,0.7)',
          color: '#007bff', padding: '3px 10px', borderRadius: '15px', fontSize: '10px', fontWeight: 'bold',
          backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.3)', pointerEvents: 'none',
        }}>
          {label.name}
        </div>
      ))}
    </div>
  );
};

export default Globe;