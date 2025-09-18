declare module '*.mp3'

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>
  export default content
}
declare module '*.webp' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>
  export default content
}
