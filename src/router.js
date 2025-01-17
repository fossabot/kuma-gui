import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

export default (store) => {
  const routes = [
    {
      path: '/404',
      name: 'not-found',
      alias: '*',
      meta: {
        title: 'Page not found',
        excludeAsBreadcrumb: true
      },
      component: () => import('@/views/NotFound')
    },
    {
      path: '/',
      redirect: { name: 'global-overview' }
    },
    // Onboarding
    {
      path: '/get-started',
      redirect: { name: 'setup-welcome' },
      component: () => import('@/views/ShellEmpty'),
      children: [
        {
          path: 'welcome',
          name: 'setup-welcome',
          meta: {
            title: 'Welcome to Kuma!',
            excludeAsBreadcrumb: true,
            hideSidebar: true,
            hideStatus: true,
            simpleHeader: true,
            simpleContent: true,
            onboardingProcess: true
          },
          component: () => import('@/views/Onboarding/GetStarted')
        },
        {
          path: 'complete',
          name: 'setup-complete',
          meta: {
            title: 'Congratulations!',
            excludeAsBreadcrumb: true,
            hideSidebar: true,
            hideStatus: true,
            simpleHeader: true,
            simpleContent: true,
            onboardingProcess: true
          },
          component: () => import('@/views/Onboarding/Complete')
        }
      ]
    },
    {
      // Entity Wizard
      path: '/wizard',
      name: 'wizard',
      component: () => import('@/views/Shell'),
      children: [
        {
          path: 'mesh',
          name: 'create-mesh',
          meta: {
            title: 'Create a new Mesh',
            excludeAsBreadcrumb: true
          },
          component: () => import('@/views/Wizard/views/Mesh')
        }
      ]
    },
    // App

    // meshes
    {
      path: '/overview',
      alias: '/',
      name: 'global-overview',
      component: () => import('@/views/Overview'),
      meta: {
        title: 'Global Overview',
        breadcrumb: 'Overview'
      }
    },
    // all Meshes
    {
      path: '/meshes',
      name: 'all-meshes',
      meta: {
        title: 'Meshes',
        breadcrumb: 'Meshes',
        parent: 'global-overview'
      },
      params: { mesh: ':mesh' },
      component: () => import('@/views/Shell'),
      children: [
        {
          path: ':mesh',
          name: 'mesh-child',
          meta: {
            title: 'Mesh Overview',
            parent: 'all-meshes'
          },
          params: { mesh: ':mesh' },
          component: () => import('@/views/Entities/Meshes')
        }
      ]
    },
    {
      path: '/:mesh',
      name: 'mesh',
      meta: {
        title: 'Meshes',
        breadcrumb: 'Meshes',
        parent: 'mesh-overview'
      },
      params: { mesh: ':mesh' },
      component: () => import('@/views/Shell'),
      children: [
        // dataplanes
        {
          path: 'dataplanes',
          name: 'dataplanes',
          meta: {
            title: 'Dataplanes',
            parent: 'dataplanes'
          },
          component: () => import('@/views/Entities/Dataplanes')
        },
        // traffic permissions
        {
          path: 'traffic-permissions',
          name: 'traffic-permissions',
          meta: {
            title: 'Traffic Permissions'
          },
          component: () => import('@/views/Policies/TrafficPermissions')
        },
        // traffic routes
        {
          path: 'traffic-routes',
          name: 'traffic-routes',
          meta: {
            title: 'Traffic Routes'
          },
          component: () => import('@/views/Policies/TrafficRoutes')
        },
        // traffic logs
        {
          path: 'traffic-logs',
          name: 'traffic-logs',
          meta: {
            title: 'Traffic Logs'
          },
          component: () => import('@/views/Policies/TrafficLogs')
        },
        // traffic traces
        {
          path: 'traffic-traces',
          name: 'traffic-traces',
          meta: {
            title: 'Traffic Traces'
          },
          component: () => import('@/views/Policies/TrafficTraces')
        },
        // fault injections
        {
          path: 'fault-injections',
          name: 'fault-injections',
          meta: {
            title: 'Fault Injections'
          },
          component: () => import('@/views/Policies/FaultInjections')
        },
        // fault injections
        {
          path: 'fault-injections',
          name: 'fault-injections',
          meta: {
            title: 'Fault Injections'
          },
          component: () => import('@/views/Policies/FaultInjection')
        },
        {
          path: 'fault-injections/:faultinjection',
          name: 'fault-injections-details',
          params: {
            faultinjection: ':faultinjection'
          },
          meta: {
            title: 'Fault Injection Details',
            breadcrumb: 'Fault Injections',
            parent: 'fault-injections'
          },
          component: () => import('@/views/Policies/FaultInjectionDetail')
        },
        // health checks
        {
          path: 'health-checks',
          name: 'health-checks',
          meta: {
            title: 'Health Checks'
          },
          component: () => import('@/views/Policies/HealthChecks')
        },
        // proxy templates
        {
          path: 'proxy-templates',
          name: 'proxy-templates',
          meta: {
            title: 'Proxy Templates'
          },
          component: () => import('@/views/Policies/ProxyTemplates')
        }
      ]
    }
  ]

  const router = new VueRouter({
    /**
     * Defaulting to hash mode since this runs within Kuma itself
     * and it's easier to avoid having to do advanced server config
     * simply for hash-free URLs.
     */
    // mode: 'history',
    base: process.env.BASE_URL,
    routes: routes
  })

  // Set $router.previous on each route
  router.beforeResolve((to, from, next) => {
    router.previous = from
    next()
  })

  /**
   * This will make sure that the Meshes page displays all meshes
   * if the user happens to go to the bare `/meshes` url with no
   * query on the end of it.
   */
  router.beforeEach((to, from, next) => {
    if (to.name === 'all-meshes') {
      next({
        name: 'mesh-child',
        params: { mesh: 'all' }
      })
    } else {
      next()
    }
  })

  /**
   * A route guard for handling the onboarding process. If the user hasn't gone
   * through the setup/onboarding process yet, this sends them through it. Once
   * completed, a localStorage value is set to true so that they're not sent
   * through it again.
   */
  router.beforeEach((to, from, next) => {
    const hasOnboarded = JSON.parse(localStorage.getItem('kumaOnboardingComplete') || null)
    const currentRoute = to.meta.onboardingProcess

    if ((!hasOnboarded || hasOnboarded === false) && !currentRoute) {
      next({ name: 'setup-welcome' })
    } else {
      next()
    }
  })

  /**
   * Navigate up URL hierarchy
   *
   * @param {Number} levels - number of url directories to jump up e.g. if
   *   "/consumers/123/update" is currentRoute, then levels = 2 would return
   *   "/consumers"
   * @param {Boolean} redirect - if true, this will perform a redirect
   * @returns {String} returns the path of the path calculation
   */
  router.navigateUp = function (levels = 1, redirect = true) {
    var upperPath = this.currentRoute.path.split('/')

    if (upperPath.length >= levels) {
      upperPath.splice(upperPath.length - levels)
      const path = upperPath.join('/')

      redirect && this.push({ path })

      return path
    }
  }

  router.onReady(() => {
    store.commit('SET_GLOBAL_LOADING', { globalLoading: true })

    setTimeout(() => {
      store.commit('SET_GLOBAL_LOADING', { globalLoading: false })
    }, 1000)
  })

  return router
}
