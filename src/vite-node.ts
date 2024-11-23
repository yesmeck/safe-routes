import { createServer } from 'vite'
import { ViteNodeRunner } from 'vite-node/client'
import { ViteNodeServer } from 'vite-node/server'

export async function createContext() {
  const server = await createServer({
    server: {
      preTransformRequests: false,
      hmr: false,
    },
    optimizeDeps: {
      noDiscovery: true,
    },
  })

  await server.pluginContainer.buildStart({})

  const node = new ViteNodeServer(server)

  const runner = new ViteNodeRunner({
    root: server.config.root,
    base: server.config.base,
    fetchModule(id) {
      return node.fetchModule(id)
    },
    resolveId(id, importer) {
      return node.resolveId(id, importer)
    },
  })

  return { server, runner };
}
