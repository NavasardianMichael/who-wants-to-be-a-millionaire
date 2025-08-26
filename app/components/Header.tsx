import { Image, View } from 'react-native'

export default function Header() {
  return (
    <View>
      <Image style={{ width: 100, height: 100 }} className='m-auto mb-large' source={require('../assets/images/logo.webp')} />
    </View>
  )
}
