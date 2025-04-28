// /media/thithilab/ボリューム1/ACR/ACR-app/jest.setup.ts
import '@testing-library/jest-native/extend-expect';
// react-native-gesture-handler のセットアップを追加
import 'react-native-gesture-handler/jestSetup';

// react-native-svg のモックを追加 (Temporarily comment out)
// jest.mock('react-native-svg', () => {
//   const React = require('react');
//   // SVGコンポーネントの代わりとなるシンプルなコンポーネントを定義
//   const MockSvg = (props: any) => React.createElement('svg', props, props.children);
//   const MockPath = (props: any) => React.createElement('path', props, props.children);
//   // 必要に応じて他のSVG要素 (Circle, Rect など) のモックも追加
//   return {
//     __esModule: true,
//     default: MockSvg,
//     Svg: MockSvg,
//     Path: MockPath,
//     // 他の要素 ...
//   };
// });

// アニメーション関連のモック (必要に応じて追加) (Temporarily comment out)
// jest.mock('react-native-reanimated', () => {
//   const Reanimated = require('react-native-reanimated/mock');
//   Reanimated.default.call = () => {}; // 必要に応じたモック実装
//   return Reanimated;
// });
