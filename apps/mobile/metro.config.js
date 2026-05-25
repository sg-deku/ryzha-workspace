const { getDefaultConfig } = require("expo/metro-config")
const { withNativeWind } = require("nativewind/metro")
const path = require("path")

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, "../..")

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
]

const FORCE_LOCAL = ["react", "react-dom", "react-native", "react-native-web"]

const originalResolveRequest = config.resolver.resolveRequest

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const match = FORCE_LOCAL.find(
    (pkg) => moduleName === pkg || moduleName.startsWith(pkg + "/")
  )
  if (match) {
    try {
      const filePath = require.resolve(moduleName, { paths: [projectRoot] })
      return { filePath, type: "sourceFile" }
    } catch {
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = withNativeWind(config, { input: "./global.css" })
