module.exports = {
  apps : [{
    name   : "apiServer",
    script : "./src/servers/apiServer.js hcharge",
    watch  : true,
    env : { 
      NODE_APP_INSTANCE : 1,
      SUPPRESS_NO_CONFIG_WARNING: 'y'
    }
  }, {
    name   : "dbServer",
    script : "./src/servers/dbServer.js hcharge",
    watch  : true,
    env : { 
      NODE_APP_INSTANCE : 1,
      SUPPRESS_NO_CONFIG_WARNING: 'y'
    }
  }, {
    name   : "nnmServer",
    script : "./src/servers/nnmServer.js hcharge",
    watch  : true,
    env : { 
      NODE_APP_INSTANCE : 1,
      SUPPRESS_NO_CONFIG_WARNING: 'y'
    }
  }]
}
