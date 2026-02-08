import { Object3DNode } from '@react-three/fiber';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            ambientLight: Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>;
            directionalLight: Object3DNode<THREE.DirectionalLight, typeof THREE.DirectionalLight>;
            pointLight: Object3DNode<THREE.PointLight, typeof THREE.PointLight>;
            spotLight: Object3DNode<THREE.SpotLight, typeof THREE.SpotLight>;
            mesh: Object3DNode<THREE.Mesh, typeof THREE.Mesh>;
            group: Object3DNode<THREE.Group, typeof THREE.Group>;
            sphereGeometry: Object3DNode<THREE.SphereGeometry, typeof THREE.SphereGeometry>;
            meshStandardMaterial: Object3DNode<THREE.MeshStandardMaterial, typeof THREE.MeshStandardMaterial>;
            meshPhysicalMaterial: Object3DNode<THREE.MeshPhysicalMaterial, typeof THREE.MeshPhysicalMaterial>;
        }
    }
}
