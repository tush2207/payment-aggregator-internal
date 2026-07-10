export const isProduction = import.meta.env.VITE_ENV === 'prod';
const maybeEmpty = (data) => (isProduction ? [] : data);
console.log('isProduction', isProduction);

// Manage Payment Aggregator Details Added By CO
export const GET_ALL_MANAGE_AGGREGATORS_RESPONSE = maybeEmpty([])

// Application(Customer) Form Details
export const GET_ALL_APPLICATION_RESPONSE = maybeEmpty([])

// Aggregators By Application Details
export const AGGREGRATOR_BY_APPLICATION_RESPONSE = maybeEmpty([])

// Projectiond By Application & Aggregator Details
export const PROJECTION_LIST_BASED_ON_AGG = maybeEmpty([])

export const AGGREGRATOR_DASHBOARD_TABLE_DATA = maybeEmpty([])


export const USER_DETAILS = {};

// BO - 54829
// RO - 54868
// ZO - 72983
// Co - 115019

// // BO
// 136416
// 138293
// 139326
// 140840
// 145294
// 146100
// 147781
// 142411
// 138335
// 138346
// 137682
// 135752
// 134343
// 91562


// //RO

// 59199
// 60167
// 60197
// 63346
// 63941
// 63963
// 64208
// 64842
// 64863
// 65394
// 72772
// 74603
// 74742

// //ZO



// 49931
// 52079
// 52287
// 53419
// 53549
// 54671
// 54854
// 54898
// 54918
// 54930
// 54956

// //CO/ DO

// 148501