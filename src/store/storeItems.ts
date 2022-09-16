// export default [
//   //common
//   {
//     name: "measureTypes",
//     actionName: "FETCH_MEASURE_TYPES",
//     url: "/screen/monitor/listMeasures",
//     method: "get",
//     data: (res) => {
//       const obj = {};
//       res.list.forEach((item) => {
//         obj[item.dictValue] = item;
//       });
//       return obj;
//     },
//     default: {},
//   },
//   {
//     name: "projectList",
//     actionName: "FETCH_PROJECT_LIST",
//     url: "/screen/project/listProject",
//     method: "get",
//     default: {},
//   },

//   //device
//   {
//     name: "deviceProjectDailyUseageList",
//     actionName: "FETCH_DEVICE_DAILY_USEAGE_LIST",
//     url: "/screen/equipment/dailyUseListByProject",
//     method: "get",
//     default: [],
//     data: (res) => {
//       const obj = {};
//       let i = -1;
//       res.equipmentUseList.forEach((item, index) => {
//         if (!obj[item.eqNo]) {
//           obj[item.eqNo] = [];
//           i++;
//         }
//         obj[item.eqNo].push({
//           name: item.categoryName,
//           value: [i, new Date(item.onTime).getTime(), new Date(item.offTime).getTime()],
//         });
//       });
//       return obj;
//     },
//   },
//   {
//     name: "deviceProjectUseageList",
//     actionName: "FETCH_DEVICE_PROJECT_USEAGE_LIST",
//     url: "/screen/equipment/useListByProject",
//     method: "get",
//     default: [],
//     data: (res) => {
//       return res.categoryUseList;
//     },
//   },
//   {
//     name: "deviceList",
//     actionName: "FETCH_DEVICE_LIST",
//     url: "/screen/equipment/list",
//     method: "get",
//     default: {},
//   },
//   {
//     name: "deviceValidList",
//     actionName: "FETCH_DEVICE_VALID_LIST",
//     url: "/screen/equipment/listForValid",
//     method: "get",
//     default: {},
//   },

//   {
//     name: "alertList",
//     actionName: "FETCH_ALERT_LIST",
//     url: "/screen/monitor/listAlarm",
//     method: "get",
//     default: {},
//     data: (res, data, params) => {
//       const obj = { ...data };
//       obj[params.projectId] = res.list;
//       return obj;
//     },
//   },
//   {
//     name: "workPointList",
//     actionName: "FETCH_WORK_POINT_LIST",
//     url: "/screen/monitor/listWorkpoint",
//     method: "get",
//     default: {},
//   },
//   {
//     name: "measureItemList",
//     actionName: "FETCH_MEASURE_ITEM_LIST",
//     url: "/screen/monitor/listMeasureItem",
//     method: "get",
//     default: {},
//   },
//   {
//     name: "sumList",
//     actionName: "FETCH_SUM_LIST",
//     url: "/screen/monitor/listSum",
//     method: "get",
//     default: {},
//     data: (res, data, params) => {
//       const obj = { ...data };
//       obj[params.mpNo] = res.sumList;
//       return obj;
//     },
//   },
//   {
//     name: "planList",
//     actionName: "FETCH_PLAN_LIST",
//     url: "/screen/monitor/planList",
//     method: "get",
//     data: (res, data, params) => {
//       const obj = { ...data };
//       const arr = [];
//       const users = {};
//       res.users.forEach((item) => {
//         users[item.userId] = item;
//       });
//       const planList = res.planList.sort((a, b) => {
//         return a.measurePerson - b.measurePerson;
//       });
//       let userId = null;
//       let taskType = [];
//       planList.forEach((item) => {
//         if (item.measurePerson === userId) {
//           taskType.push(item.taskType);
//         } else {
//           userId = item.measurePerson;
//           taskType = [item.taskType];
//           arr.push({
//             measurePerson: users[userId].nickName,
//             measureDate: item.measureDate,
//             taskType,
//           });
//         }
//       });
//       obj[params.projectId] = arr;
//       return obj;
//     },
//     default: {},
//   },
//   {
//     name: "checkRecordList",
//     actionName: "FETCH_CHECK_RECORD_LIST",
//     url: "/screen/check/listRecord",
//     method: "get",
//     default: {},
//     data: (res, data, params) => {
//       const obj = { ...data };
//       obj[params.projectId] = res.list;
//       return obj;
//     },
//   },
//   // {
//   //   name: "countList",
//   //   actionName: "FETCH_COUNT_LIST",
//   //   url: "/screen/monitor/listCount",
//   //   method: "get",
//   //   default: {},
//   //   data: (res, data, params) => {
//   //     const obj = { ...data };
//   //     obj[params.projectId] = res.projectCountMap;
//   //     return obj;
//   //   },
//   // },
//   {
//     name: "projectCountList",
//     actionName: "FETCH_PROJECT_COUNT_LIST",
//     url: "/screen/monitor/listCountByProject",
//     method: "get",
//     default: {},
//   },
//   {
//     name: "eventGroupList",
//     actionName: "FETCH_EVENT_GROUP_LIST",
//     url: "/screen/project/eventGroup",
//     method: "get",
//     default: [],
//     data: (res) => res.data,
//   },
//   {
//     name: "pointGroupList",
//     actionName: "FETCH_POINT_GROUP_LIST",
//     url: "/screen/project/groupByPoint",
//     method: "get",
//     default: {},
//   },
//   {
//     name: "staffProfessionList",
//     actionName: "FETCH_STAFF_PROFESSION_LIST",
//     url: "/screen/staff/groupByProfessional",
//     method: "get",
//     default: {},
//   },
//   {
//     name: "staffEducationList",
//     actionName: "FETCH_STAFF_EDUCATION_LIST",
//     url: "/screen/staff/groupByEducation",
//     method: "get",
//     default: {},
//   },
//   {
//     name: "staffEntryList",
//     actionName: "FETCH_STAFF_ENTRY_LIST",
//     url: "/screen/staff/groupByEntry",
//     method: "get",
//     default: {},
//   },
//   {
//     name: "staffProjectList",
//     actionName: "FETCH_STAFF_PROJECT_LIST",
//     url: "/screen/staff/groupByProject",
//     method: "get",
//     default: {},
//   },
//   {
//     name: "monitorItemList",
//     actionName: "FETCH_MONITOR_ITEM_LIST",
//     url: "/screen/monitor/listWithItems",
//     method: "get",
//     default: {},
//     data: (res, data, params) => {
//       data[params.wpId] = res.list;
//       return data;
//     },
//   },
//   {
//     name: "monitorCheckList",
//     mutationName: "FETCH_STAFF_PROJECT_LIST",
//     url: "/screen/staff/groupByProject",
//     method: "get",
//     default: {},
//   },
//   {
//     name: "monitorCheckList",
//     mutationName: "UPDATE_MONITOR_CHECK_LIST",
//     default: {},
//     data: (newVal, oldVal) => {
//       const obj = { ...oldVal };
//       for (const i in newVal) {
//         obj[i] = newVal[i];
//       }
//       return obj;
//     },
//   },
//   {
//     name: "onlineDeviceList",
//     actionName: "FETCH_ONLINE_DEVICE_LIST",
//     url: "/screen/equipment/onLine",
//     method: "get",
//     default: {},
//     data: (res, data, params) => {
//       data[params.projectId] = res.equipmentList;
//       return data;
//     },
//   },
//   {
//     name: "currentProject",
//     mutationName: "CHANGE_PROJECT",
//     default: {},
//   },
//   {
//     name: "userPositionList",
//     mutationName: "UPDATE_USER_POSITION",
//     default: {},
//     data: (newVal, oldVal) => {
//       const obj = { ...oldVal };
//       for (const i in newVal) {
//         obj[i] = newVal[i];
//       }
//       return obj;
//     },
//   },
//   {
//     name: "userPositionList",
//     mutationName: "REMOVE_USER_POSITION",
//     default: {},
//     data: (userId, data) => {
//       const obj = { ...data };
//       delete obj[userId];
//       return obj;
//     },
//   },
//   {
//     name: "onlineDeviceList",
//     mutationName: "UPDATE_ONLINE_DEVICE_LIST",
//     default: {},
//     data: (newVal, oldVal) => {
//       const obj = { ...oldVal.data };
//       if (!obj[newVal.projectId]) obj[newVal.projectId] = [];
//       for (let i = 0; i < obj[newVal.projectId].length; i++) {
//         if (obj[newVal.projectId][i].eqNo === newVal.eqNo) {
//           obj[newVal.projectId][i] = newVal;
//           return { status: oldVal.status, data: obj };
//         }
//       }
//       obj[newVal.projectId].push(newVal);
//       return { status: oldVal.status, data: obj };
//     },
//   },
//   {
//     name: "onlineDeviceList",
//     mutationName: "REMOVE_ONLINE_DEVICE",
//     default: {},
//     data: (data, oldVal) => {
//       const { projectId, equipNo } = data;
//       if (!oldVal) return oldVal;
//       const obj = { ...oldVal.data };
//       if (!obj[projectId]) return oldVal;
//       for (let i = 0; i < obj[projectId].length; i++) {
//         const item = obj[projectId][i];
//         if (item.eqNo === equipNo) {
//           obj[projectId].splice(i, 1);
//           break;
//         }
//       }
//       return { status: oldVal.status, data: obj };
//     },
//   },
//   {
//     name: "deviceProjectDailyUseageList",
//     mutationName: "UPDATE_DEVICE_DAILY_USEAGE",
//     default: {},
//     data: (data, oldVal) => {
//       if (data.onTime && data.offTime) {
//         oldVal.data[data.equipNo].push({
//           name: data.categoryName || "",
//           value: [
//             Object.keys(oldVal.data).indexOf(data.equipNo),
//             new Date(data.onTime).getTime(),
//             new Date(data.offTime).getTime(),
//           ],
//         });
//       }
//       return { ...oldVal };
//     },
//   },
// ];
