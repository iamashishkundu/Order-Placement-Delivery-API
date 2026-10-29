const fs = require('fs');
const path = require('path');
const express = require('express');
const authenticate = require('../common/middlewares/authenticate');
const authorizeRole = require('../common/middlewares/authorizeRole');
const ROLES = require('../common/constants/roles');

/**
 * Calculates specificity score for a route path.
 * Higher score = higher priority (mounted earlier).
 * Pure static routes: score 1000+
 * Routes with params and static suffixes (e.g. /:id/approve, /:id/stock): score 500+
 * Pure param routes (e.g. /:id): score 100+
 */
const getRouteScore = (router) => {
  if (!router || !router.stack || router.stack.length === 0) {
    return 100;
  }

  let maxScore = 0;
  router.stack.forEach((layer) => {
    if (layer.route && layer.route.path) {
      const routePath = layer.route.path;
      const segments = routePath.split('/').filter(Boolean);
      const paramCount = segments.filter((s) => s.startsWith(':')).length;
      const staticCount = segments.length - paramCount;

      let score = 100;
      if (paramCount === 0) {
        score = 1000 + staticCount * 10;
      } else if (staticCount > 0) {
        score = 500 + staticCount * 10 - paramCount;
      } else {
        score = 100 - paramCount;
      }

      if (score > maxScore) {
        maxScore = score;
      }
    }
  });

  return maxScore;
};

/**
 * Dynamically loads and mounts all routes from src/v1/modules.
 * Follows strict architecture:
 * - Scans src/v1/modules/<role>/<feature>/<action>/<action>.route.js
 * - Mounts static paths before parameterized paths
 * - Applies authenticate + authorizeRole(role) for non-auth features
 * - Auth feature routes remain public
 */
const loadRoutes = (app) => {
  const allowedRoles = [ROLES.ADMIN, ROLES.VENDOR, ROLES.CUSTOMER];
  const modulesDir = path.resolve(__dirname, '../v1/modules');

  if (!fs.existsSync(modulesDir)) {
    return;
  }

  const roleDirs = fs.readdirSync(modulesDir).filter((dir) => {
    return allowedRoles.includes(dir) && fs.statSync(path.join(modulesDir, dir)).isDirectory();
  });

  roleDirs.forEach((role) => {
    const rolePath = path.join(modulesDir, role);
    const featureDirs = fs.readdirSync(rolePath).filter((dir) => {
      // Ignore models, middlewares or hidden directories
      if (dir === 'models' || dir === 'middlewares' || dir.startsWith('.')) {
        return false;
      }
      return fs.statSync(path.join(rolePath, dir)).isDirectory();
    });

    featureDirs.forEach((feature) => {
      const featurePath = path.join(rolePath, feature);
      const actionDirs = fs.readdirSync(featurePath).filter((dir) => {
        return fs.statSync(path.join(featurePath, dir)).isDirectory();
      });

      const actionRouters = [];

      actionDirs.forEach((action) => {
        const actionPath = path.join(featurePath, action);
        const routeFile = path.join(actionPath, `${action}.route.js`);

        if (fs.existsSync(routeFile)) {
          try {
            const router = require(routeFile);
            if (router && typeof router === 'function') {
              const score = getRouteScore(router);
              actionRouters.push({
                action,
                router,
                score,
              });
            }
          } catch (err) {
            console.error(`Failed to load route file: ${routeFile}`, err);
          }
        }
      });

      if (actionRouters.length === 0) return;

      // Sort action routers: static paths before parameterized paths
      actionRouters.sort((a, b) => b.score - a.score);

      const featureRouter = express.Router();
      actionRouters.forEach(({ router }) => {
        featureRouter.use(router);
      });

      const prefix = `/api/v1/${role}/${feature}`;

      if (feature === 'auth') {
        // Auth feature routes are public
        app.use(prefix, featureRouter);
        if (process.env.DEBUG_ROUTES === 'true') {
          console.log(`[Route Mounted] PUBLIC: ${prefix}`);
        }
      } else {
        // Protected routes: authenticate + authorizeRole(role)
        app.use(prefix, authenticate, authorizeRole(role), featureRouter);
        if (process.env.DEBUG_ROUTES === 'true') {
          console.log(`[Route Mounted] PROTECTED (${role}): ${prefix}`);
        }
      }
    });
  });
};

module.exports = {
  loadRoutes,
  getRouteScore,
};

