import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        collection: resolve(__dirname, 'Collection.html'),
        comunity: resolve(__dirname, 'Comunity.html'),
        heritage: resolve(__dirname, 'Hertiage.html'),
        order: resolve(__dirname, 'Order.html'),
        threed: resolve(__dirname, 'threed.html'),
        profile: resolve(__dirname, 'Profile.html'),
        login: resolve(__dirname, 'Login.html'),
        registration: resolve(__dirname, 'Registration.html'),
        bag: resolve(__dirname, 'bag.html'),
      }
    }
  }
});
