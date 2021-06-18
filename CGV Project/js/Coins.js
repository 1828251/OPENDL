import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
//Coin builder
function Coins(z) {
      var coingeo = new THREE.CylinderGeometry(5, 5, 2, 15);
      const cointexture = new THREE.TextureLoader().load("./textures/level1/cointexture.png");
      cointexture.wrapS = THREE.RepeatWrapping;
      cointexture.wrapT = THREE.RepeatWrapping;
      cointexture.repeat.set(1, 1);
      const coinmat = new THREE.MeshStandardMaterial({ map: cointexture });
      var coin = new THREE.Mesh(coingeo, coinmat);
      coin.castShadow = true;
      coin.position.y = 10;
      coin.position.z = -30 * z;
      coin.position.x = Math.floor(Math.random() * 100) - 50;
      coin.rotation.y = Math.PI / 2;
      coin.rotation.x = Math.PI / 2;
      return coin;
}

export { Coins }