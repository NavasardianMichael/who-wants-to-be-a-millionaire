const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native']

config.transformer.babelTransformerPath = require.resolve(
  'react-native-svg-transformer'
)
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== 'svg'
)
config.resolver.sourceExts.push('svg')

module.exports = withNativeWind(config, { input: './styles/globals.css' })
