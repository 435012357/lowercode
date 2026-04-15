import { init, plugins } from '@alilc/lowcode-engine'

const Home = () => {
  const lowcodeContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    init(lowcodeContainerRef.current!, {
      locale: 'zh-CN',
      enableCondition: true,
      enableCanvasLock: true,
      // 默认绑定变量
      supportVariableGlobally: true,
      // requestHandlersMap: {
      //   fetch: createFetchHandler(),
      // },
      // appHelper,
      enableContextMenu: true,
    })
  }, [])

  return <div ref={lowcodeContainerRef} className="h-full w-full" />
}

export default Home
