"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "instrumentation";
exports.ids = ["instrumentation"];
exports.modules = {

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "punycode":
/*!***************************!*\
  !*** external "punycode" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("punycode");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("stream");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(instrument)/./instrumentation.ts":
/*!****************************!*\
  !*** ./instrumentation.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   onCLS: () => (/* binding */ onCLS),\n/* harmony export */   onFCP: () => (/* binding */ onFCP),\n/* harmony export */   onFID: () => (/* binding */ onFID),\n/* harmony export */   onLCP: () => (/* binding */ onLCP),\n/* harmony export */   onTTFB: () => (/* binding */ onTTFB),\n/* harmony export */   register: () => (/* binding */ register)\n/* harmony export */ });\n/* harmony import */ var _lib_observability_metrics__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/lib/observability/metrics */ \"(instrument)/./lib/observability/metrics.ts\");\n\nfunction register() {\n// no-op required by Next.js instrumentation API\n}\nasync function onCLS(metric) {\n    await (0,_lib_observability_metrics__WEBPACK_IMPORTED_MODULE_0__.reportWebVital)({\n        metric: metric.name,\n        value: metric.value,\n        label: metric.label\n    });\n}\nasync function onFCP(metric) {\n    await (0,_lib_observability_metrics__WEBPACK_IMPORTED_MODULE_0__.reportWebVital)({\n        metric: metric.name,\n        value: metric.value,\n        label: metric.label\n    });\n}\nasync function onFID(metric) {\n    await (0,_lib_observability_metrics__WEBPACK_IMPORTED_MODULE_0__.reportWebVital)({\n        metric: metric.name,\n        value: metric.value,\n        label: metric.label\n    });\n}\nasync function onLCP(metric) {\n    await (0,_lib_observability_metrics__WEBPACK_IMPORTED_MODULE_0__.reportWebVital)({\n        metric: metric.name,\n        value: metric.value,\n        label: metric.label\n    });\n}\nasync function onTTFB(metric) {\n    await (0,_lib_observability_metrics__WEBPACK_IMPORTED_MODULE_0__.reportWebVital)({\n        metric: metric.name,\n        value: metric.value,\n        label: metric.label\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGluc3RydW1lbnQpLy4vaW5zdHJ1bWVudGF0aW9uLnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBNkQ7QUFFdEQsU0FBU0M7QUFDZCxnREFBZ0Q7QUFDbEQ7QUFFTyxlQUFlQyxNQUFNQyxNQUFzRDtJQUNoRixNQUFNSCwwRUFBY0EsQ0FBQztRQUFFRyxRQUFRQSxPQUFPQyxJQUFJO1FBQUVDLE9BQU9GLE9BQU9FLEtBQUs7UUFBRUMsT0FBT0gsT0FBT0csS0FBSztJQUFDO0FBQ3ZGO0FBRU8sZUFBZUMsTUFBTUosTUFBc0Q7SUFDaEYsTUFBTUgsMEVBQWNBLENBQUM7UUFBRUcsUUFBUUEsT0FBT0MsSUFBSTtRQUFFQyxPQUFPRixPQUFPRSxLQUFLO1FBQUVDLE9BQU9ILE9BQU9HLEtBQUs7SUFBQztBQUN2RjtBQUVPLGVBQWVFLE1BQU1MLE1BQXNEO0lBQ2hGLE1BQU1ILDBFQUFjQSxDQUFDO1FBQUVHLFFBQVFBLE9BQU9DLElBQUk7UUFBRUMsT0FBT0YsT0FBT0UsS0FBSztRQUFFQyxPQUFPSCxPQUFPRyxLQUFLO0lBQUM7QUFDdkY7QUFFTyxlQUFlRyxNQUFNTixNQUFzRDtJQUNoRixNQUFNSCwwRUFBY0EsQ0FBQztRQUFFRyxRQUFRQSxPQUFPQyxJQUFJO1FBQUVDLE9BQU9GLE9BQU9FLEtBQUs7UUFBRUMsT0FBT0gsT0FBT0csS0FBSztJQUFDO0FBQ3ZGO0FBRU8sZUFBZUksT0FBT1AsTUFBc0Q7SUFDakYsTUFBTUgsMEVBQWNBLENBQUM7UUFBRUcsUUFBUUEsT0FBT0MsSUFBSTtRQUFFQyxPQUFPRixPQUFPRSxLQUFLO1FBQUVDLE9BQU9ILE9BQU9HLEtBQUs7SUFBQztBQUN2RiIsInNvdXJjZXMiOlsid2VicGFjazovL2NsaWVudGUtcHJvdmVlZG9yLXRyYWNrZXIvLi9pbnN0cnVtZW50YXRpb24udHM/ZDdkNyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZXBvcnRXZWJWaXRhbCB9IGZyb20gJ0AvbGliL29ic2VydmFiaWxpdHkvbWV0cmljcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlcigpIHtcbiAgLy8gbm8tb3AgcmVxdWlyZWQgYnkgTmV4dC5qcyBpbnN0cnVtZW50YXRpb24gQVBJXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbkNMUyhtZXRyaWM6IHsgbmFtZTogc3RyaW5nOyB2YWx1ZTogbnVtYmVyOyBsYWJlbDogc3RyaW5nIH0pIHtcbiAgYXdhaXQgcmVwb3J0V2ViVml0YWwoeyBtZXRyaWM6IG1ldHJpYy5uYW1lLCB2YWx1ZTogbWV0cmljLnZhbHVlLCBsYWJlbDogbWV0cmljLmxhYmVsIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25GQ1AobWV0cmljOiB7IG5hbWU6IHN0cmluZzsgdmFsdWU6IG51bWJlcjsgbGFiZWw6IHN0cmluZyB9KSB7XG4gIGF3YWl0IHJlcG9ydFdlYlZpdGFsKHsgbWV0cmljOiBtZXRyaWMubmFtZSwgdmFsdWU6IG1ldHJpYy52YWx1ZSwgbGFiZWw6IG1ldHJpYy5sYWJlbCB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uRklEKG1ldHJpYzogeyBuYW1lOiBzdHJpbmc7IHZhbHVlOiBudW1iZXI7IGxhYmVsOiBzdHJpbmcgfSkge1xuICBhd2FpdCByZXBvcnRXZWJWaXRhbCh7IG1ldHJpYzogbWV0cmljLm5hbWUsIHZhbHVlOiBtZXRyaWMudmFsdWUsIGxhYmVsOiBtZXRyaWMubGFiZWwgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbkxDUChtZXRyaWM6IHsgbmFtZTogc3RyaW5nOyB2YWx1ZTogbnVtYmVyOyBsYWJlbDogc3RyaW5nIH0pIHtcbiAgYXdhaXQgcmVwb3J0V2ViVml0YWwoeyBtZXRyaWM6IG1ldHJpYy5uYW1lLCB2YWx1ZTogbWV0cmljLnZhbHVlLCBsYWJlbDogbWV0cmljLmxhYmVsIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25UVEZCKG1ldHJpYzogeyBuYW1lOiBzdHJpbmc7IHZhbHVlOiBudW1iZXI7IGxhYmVsOiBzdHJpbmcgfSkge1xuICBhd2FpdCByZXBvcnRXZWJWaXRhbCh7IG1ldHJpYzogbWV0cmljLm5hbWUsIHZhbHVlOiBtZXRyaWMudmFsdWUsIGxhYmVsOiBtZXRyaWMubGFiZWwgfSk7XG59XG4iXSwibmFtZXMiOlsicmVwb3J0V2ViVml0YWwiLCJyZWdpc3RlciIsIm9uQ0xTIiwibWV0cmljIiwibmFtZSIsInZhbHVlIiwibGFiZWwiLCJvbkZDUCIsIm9uRklEIiwib25MQ1AiLCJvblRURkIiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(instrument)/./instrumentation.ts\n");

/***/ }),

/***/ "(instrument)/./lib/env.ts":
/*!********************!*\
  !*** ./lib/env.ts ***!
  \********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   getClientEnv: () => (/* binding */ getClientEnv),\n/* harmony export */   getServerEnv: () => (/* binding */ getServerEnv)\n/* harmony export */ });\nconst requiredServerEnv = [\n    \"SUPABASE_URL\",\n    \"SUPABASE_SERVICE_ROLE_KEY\"\n];\nconst requiredClientEnv = [\n    \"NEXT_PUBLIC_SUPABASE_URL\",\n    \"NEXT_PUBLIC_SUPABASE_ANON_KEY\"\n];\nfunction getServerEnv() {\n    return requiredServerEnv.reduce((acc, key)=>{\n        const value = process.env[key];\n        if (!value) {\n            throw new Error(`Missing required server env var ${key}`);\n        }\n        return {\n            ...acc,\n            [key]: value\n        };\n    }, {});\n}\nfunction getClientEnv() {\n    return requiredClientEnv.reduce((acc, key)=>{\n        const value = process.env[key];\n        if (!value) {\n            throw new Error(`Missing required client env var ${key}`);\n        }\n        return {\n            ...acc,\n            [key]: value\n        };\n    }, {});\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGluc3RydW1lbnQpLy4vbGliL2Vudi50cyIsIm1hcHBpbmdzIjoiOzs7OztBQUFBLE1BQU1BLG9CQUFvQjtJQUFDO0lBQWdCO0NBQTRCO0FBQ3ZFLE1BQU1DLG9CQUFvQjtJQUFDO0lBQTRCO0NBQWdDO0FBS2hGLFNBQVNDO0lBQ2QsT0FBT0Ysa0JBQWtCRyxNQUFNLENBQUMsQ0FBQ0MsS0FBS0M7UUFDcEMsTUFBTUMsUUFBUUMsUUFBUUMsR0FBRyxDQUFDSCxJQUFJO1FBQzlCLElBQUksQ0FBQ0MsT0FBTztZQUNWLE1BQU0sSUFBSUcsTUFBTSxDQUFDLGdDQUFnQyxFQUFFSixJQUFJLENBQUM7UUFDMUQ7UUFDQSxPQUFPO1lBQUUsR0FBR0QsR0FBRztZQUFFLENBQUNDLElBQUksRUFBRUM7UUFBTTtJQUNoQyxHQUFHLENBQUM7QUFDTjtBQUVPLFNBQVNJO0lBQ2QsT0FBT1Qsa0JBQWtCRSxNQUFNLENBQUMsQ0FBQ0MsS0FBS0M7UUFDcEMsTUFBTUMsUUFBUUMsUUFBUUMsR0FBRyxDQUFDSCxJQUFJO1FBQzlCLElBQUksQ0FBQ0MsT0FBTztZQUNWLE1BQU0sSUFBSUcsTUFBTSxDQUFDLGdDQUFnQyxFQUFFSixJQUFJLENBQUM7UUFDMUQ7UUFDQSxPQUFPO1lBQUUsR0FBR0QsR0FBRztZQUFFLENBQUNDLElBQUksRUFBRUM7UUFBTTtJQUNoQyxHQUFHLENBQUM7QUFDTiIsInNvdXJjZXMiOlsid2VicGFjazovL2NsaWVudGUtcHJvdmVlZG9yLXRyYWNrZXIvLi9saWIvZW52LnRzPzkzZjIiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgcmVxdWlyZWRTZXJ2ZXJFbnYgPSBbJ1NVUEFCQVNFX1VSTCcsICdTVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZJ10gYXMgY29uc3Q7XG5jb25zdCByZXF1aXJlZENsaWVudEVudiA9IFsnTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMJywgJ05FWFRfUFVCTElDX1NVUEFCQVNFX0FOT05fS0VZJ10gYXMgY29uc3Q7XG5cbnR5cGUgU2VydmVyRW52ID0gdHlwZW9mIHJlcXVpcmVkU2VydmVyRW52W251bWJlcl07XG50eXBlIENsaWVudEVudiA9IHR5cGVvZiByZXF1aXJlZENsaWVudEVudltudW1iZXJdO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2VydmVyRW52KCk6IFJlY29yZDxTZXJ2ZXJFbnYsIHN0cmluZz4ge1xuICByZXR1cm4gcmVxdWlyZWRTZXJ2ZXJFbnYucmVkdWNlKChhY2MsIGtleSkgPT4ge1xuICAgIGNvbnN0IHZhbHVlID0gcHJvY2Vzcy5lbnZba2V5XTtcbiAgICBpZiAoIXZhbHVlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE1pc3NpbmcgcmVxdWlyZWQgc2VydmVyIGVudiB2YXIgJHtrZXl9YCk7XG4gICAgfVxuICAgIHJldHVybiB7IC4uLmFjYywgW2tleV06IHZhbHVlIH07XG4gIH0sIHt9IGFzIFJlY29yZDxTZXJ2ZXJFbnYsIHN0cmluZz4pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2xpZW50RW52KCk6IFJlY29yZDxDbGllbnRFbnYsIHN0cmluZz4ge1xuICByZXR1cm4gcmVxdWlyZWRDbGllbnRFbnYucmVkdWNlKChhY2MsIGtleSkgPT4ge1xuICAgIGNvbnN0IHZhbHVlID0gcHJvY2Vzcy5lbnZba2V5XTtcbiAgICBpZiAoIXZhbHVlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE1pc3NpbmcgcmVxdWlyZWQgY2xpZW50IGVudiB2YXIgJHtrZXl9YCk7XG4gICAgfVxuICAgIHJldHVybiB7IC4uLmFjYywgW2tleV06IHZhbHVlIH07XG4gIH0sIHt9IGFzIFJlY29yZDxDbGllbnRFbnYsIHN0cmluZz4pO1xufVxuIl0sIm5hbWVzIjpbInJlcXVpcmVkU2VydmVyRW52IiwicmVxdWlyZWRDbGllbnRFbnYiLCJnZXRTZXJ2ZXJFbnYiLCJyZWR1Y2UiLCJhY2MiLCJrZXkiLCJ2YWx1ZSIsInByb2Nlc3MiLCJlbnYiLCJFcnJvciIsImdldENsaWVudEVudiJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(instrument)/./lib/env.ts\n");

/***/ }),

/***/ "(instrument)/./lib/observability/metrics.ts":
/*!**************************************!*\
  !*** ./lib/observability/metrics.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   reportWebVital: () => (/* binding */ reportWebVital)\n/* harmony export */ });\n/* harmony import */ var private_next_rsc_server_reference__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! private-next-rsc-server-reference */ \"(instrument)/./node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js\");\n/* harmony import */ var private_next_rsc_action_encryption__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! private-next-rsc-action-encryption */ \"(instrument)/./node_modules/next/dist/server/app-render/encryption.js\");\n/* harmony import */ var private_next_rsc_action_encryption__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(private_next_rsc_action_encryption__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _lib_supabase_service_role_client__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/supabase/service-role-client */ \"(instrument)/./lib/supabase/service-role-client.ts\");\n/* harmony import */ var private_next_rsc_action_validate__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! private-next-rsc-action-validate */ \"(instrument)/./node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js\");\n/* __next_internal_action_entry_do_not_use__ {\"f3dfda1b2a561a6582c4d51f96a3d4c4a1407264\":\"reportWebVital\"} */ \n\n\nasync function reportWebVital(payload) {\n    try {\n        const supabase = (0,_lib_supabase_service_role_client__WEBPACK_IMPORTED_MODULE_2__.createServiceRoleClient)();\n        await supabase.from(\"activity_log\").insert({\n            actor_type: \"system\",\n            action: \"web-vital\",\n            details: payload\n        });\n    } catch (error) {\n        console.error(\"web vital\", error);\n    }\n}\n\n(0,private_next_rsc_action_validate__WEBPACK_IMPORTED_MODULE_3__.ensureServerEntryExports)([\n    reportWebVital\n]);\n(0,private_next_rsc_server_reference__WEBPACK_IMPORTED_MODULE_0__.registerServerReference)(\"f3dfda1b2a561a6582c4d51f96a3d4c4a1407264\", reportWebVital);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGluc3RydW1lbnQpLy4vbGliL29ic2VydmFiaWxpdHkvbWV0cmljcy50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUU2RTtBQVN0RSxlQUFlQyxlQUFlQyxPQUF3QjtJQUMzRCxJQUFJO1FBQ0YsTUFBTUMsV0FBV0gsMEZBQXVCQTtRQUN4QyxNQUFNLFNBQWtCSSxJQUFJLENBQUMsZ0JBQWdCQyxNQUFNLENBQUM7WUFDbERDLFlBQVk7WUFDWkMsUUFBUTtZQUNSQyxTQUFTTjtRQUNYO0lBQ0YsRUFBRSxPQUFPTyxPQUFPO1FBQ2RDLFFBQVFELEtBQUssQ0FBQyxhQUFhQTtJQUM3QjtBQUNGIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vY2xpZW50ZS1wcm92ZWVkb3ItdHJhY2tlci8uL2xpYi9vYnNlcnZhYmlsaXR5L21ldHJpY3MudHM/ODkzOSJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHNlcnZlcic7XG5cbmltcG9ydCB7IGNyZWF0ZVNlcnZpY2VSb2xlQ2xpZW50IH0gZnJvbSAnQC9saWIvc3VwYWJhc2Uvc2VydmljZS1yb2xlLWNsaWVudCc7XG5cbmludGVyZmFjZSBXZWJWaXRhbFBheWxvYWQge1xuICBtZXRyaWM6IHN0cmluZztcbiAgdmFsdWU6IG51bWJlcjtcbiAgbGFiZWw6IHN0cmluZztcbiAgbmF2aWdhdGlvblR5cGU/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXBvcnRXZWJWaXRhbChwYXlsb2FkOiBXZWJWaXRhbFBheWxvYWQpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdXBhYmFzZSA9IGNyZWF0ZVNlcnZpY2VSb2xlQ2xpZW50KCk7XG4gICAgYXdhaXQgKHN1cGFiYXNlIGFzIGFueSkuZnJvbSgnYWN0aXZpdHlfbG9nJykuaW5zZXJ0KHtcbiAgICAgIGFjdG9yX3R5cGU6ICdzeXN0ZW0nLFxuICAgICAgYWN0aW9uOiAnd2ViLXZpdGFsJyxcbiAgICAgIGRldGFpbHM6IHBheWxvYWRcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCd3ZWIgdml0YWwnLCBlcnJvcik7XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJjcmVhdGVTZXJ2aWNlUm9sZUNsaWVudCIsInJlcG9ydFdlYlZpdGFsIiwicGF5bG9hZCIsInN1cGFiYXNlIiwiZnJvbSIsImluc2VydCIsImFjdG9yX3R5cGUiLCJhY3Rpb24iLCJkZXRhaWxzIiwiZXJyb3IiLCJjb25zb2xlIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(instrument)/./lib/observability/metrics.ts\n");

/***/ }),

/***/ "(instrument)/./lib/supabase/service-role-client.ts":
/*!*********************************************!*\
  !*** ./lib/supabase/service-role-client.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   createServiceRoleClient: () => (/* binding */ createServiceRoleClient)\n/* harmony export */ });\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @supabase/supabase-js */ \"(instrument)/./node_modules/@supabase/supabase-js/dist/module/index.js\");\n/* harmony import */ var _lib_env__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/lib/env */ \"(instrument)/./lib/env.ts\");\n\n\nfunction createServiceRoleClient() {\n    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = (0,_lib_env__WEBPACK_IMPORTED_MODULE_0__.getServerEnv)();\n    return (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {\n        auth: {\n            autoRefreshToken: false,\n            persistSession: false\n        }\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGluc3RydW1lbnQpLy4vbGliL3N1cGFiYXNlL3NlcnZpY2Utcm9sZS1jbGllbnQudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQXFEO0FBRVo7QUFFbEMsU0FBU0U7SUFDZCxNQUFNLEVBQUVDLFlBQVksRUFBRUMseUJBQXlCLEVBQUUsR0FBR0gsc0RBQVlBO0lBQ2hFLE9BQU9ELG1FQUFZQSxDQUFXRyxjQUFjQywyQkFBMkI7UUFDckVDLE1BQU07WUFDSkMsa0JBQWtCO1lBQ2xCQyxnQkFBZ0I7UUFDbEI7SUFDRjtBQUNGIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vY2xpZW50ZS1wcm92ZWVkb3ItdHJhY2tlci8uL2xpYi9zdXBhYmFzZS9zZXJ2aWNlLXJvbGUtY2xpZW50LnRzP2ViYjIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJztcbmltcG9ydCB0eXBlIHsgRGF0YWJhc2UgfSBmcm9tICdAL3R5cGVzL2RhdGFiYXNlJztcbmltcG9ydCB7IGdldFNlcnZlckVudiB9IGZyb20gJ0AvbGliL2Vudic7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTZXJ2aWNlUm9sZUNsaWVudCgpIHtcbiAgY29uc3QgeyBTVVBBQkFTRV9VUkwsIFNVUEFCQVNFX1NFUlZJQ0VfUk9MRV9LRVkgfSA9IGdldFNlcnZlckVudigpO1xuICByZXR1cm4gY3JlYXRlQ2xpZW50PERhdGFiYXNlPihTVVBBQkFTRV9VUkwsIFNVUEFCQVNFX1NFUlZJQ0VfUk9MRV9LRVksIHtcbiAgICBhdXRoOiB7XG4gICAgICBhdXRvUmVmcmVzaFRva2VuOiBmYWxzZSxcbiAgICAgIHBlcnNpc3RTZXNzaW9uOiBmYWxzZVxuICAgIH1cbiAgfSk7XG59XG4iXSwibmFtZXMiOlsiY3JlYXRlQ2xpZW50IiwiZ2V0U2VydmVyRW52IiwiY3JlYXRlU2VydmljZVJvbGVDbGllbnQiLCJTVVBBQkFTRV9VUkwiLCJTVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZIiwiYXV0aCIsImF1dG9SZWZyZXNoVG9rZW4iLCJwZXJzaXN0U2Vzc2lvbiJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(instrument)/./lib/supabase/service-role-client.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("./webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/@supabase","vendor-chunks/next","vendor-chunks/tr46","vendor-chunks/whatwg-url","vendor-chunks/webidl-conversions"], () => (__webpack_exec__("(instrument)/./instrumentation.ts")));
module.exports = __webpack_exports__;

})();