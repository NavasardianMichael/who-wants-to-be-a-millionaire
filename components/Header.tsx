import { useStyleByOrientation } from '@/hooks/useStyleByOrientation'
import { Image } from 'expo-image'
import { View } from 'react-native'

export default function Header() {
  const style = useStyleByOrientation(
    { width: 120, height: 120 },
    { width: 100, height: 100 }
  )

  const className = useStyleByOrientation('mb-8', 'mb-2')
  return (
    <View>
      <Image
        style={style}
        className={`mx-auto ${className} w-20 h-20`}
        source={{
          uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS7422rOY8k9HnSastRocNFsW9N4e94BUd4Oj44CMKThWXvMP8iOGHdsx0&s',
        }}
      />
    </View>
  )
}
