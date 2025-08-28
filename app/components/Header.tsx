import { Image, View } from 'react-native'

export default function Header() {
  return (
    <View>
      <Image
        style={{ width: 150, height: 150 }}
        className='m-auto mb-large'
        source={require('../assets/images/logo.webp')}
      />
    </View>
  )
}
