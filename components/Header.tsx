import { useStyleByOrientation } from '@/hooks/useStyleByOrientation';
import { Image, View } from 'react-native';

export default function Header() {
  const style = useStyleByOrientation(
    { width: 120, height: 120 },
    { width: 80, height: 80 },
  )
  const className = useStyleByOrientation('mb-8', 'mb-2');
  return (
    <View>
      <Image
        style={style}
        className={`mx-auto ${className} w-20 h-20`}
        source={require('../assets/images/logo.webp')}
      />
    </View>
  )
}
