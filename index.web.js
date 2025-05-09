import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('main', () => App);

if (typeof document !== 'undefined') {
  const rootTag = document.getElementById('root') || document.getElementById('main');
  if (rootTag) {
    Object.assign(document.body.style, {
      margin: '0',
      padding: '0',
      height: '100%',
      width: '100%',
      overflow: 'hidden'
    });
    
    AppRegistry.runApplication('main', {
      rootTag,
      initialProps: {}
    });
  }
}
