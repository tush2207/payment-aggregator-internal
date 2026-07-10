export const isProduction = import.meta.env.VITE_ENV === 'prod';
const maybeEmpty = (data) => (isProduction ? [] : data);
console.log('isProduction', isProduction);

// Manage Payment Aggregator Details Added By CO
export const GET_ALL_MANAGE_AGGREGATORS_RESPONSE = maybeEmpty([])

// Application(Customer) Form Details
export const GET_ALL_APPLICATION_RESPONSE = maybeEmpty([
    {
        "averageBalance": 23047,
        "applicationId": 205,
        "accountBalanceToday": 203894,
        "projection": "Internet banking|UPI|Credit card|Debit card",
        "isMarkUpAddedCO": null,
        "finalizedAggregatorId": null,
        "selectedAggregatorId": null,
        "rccMobileNo": null,
        "userType": "existing",
        "email": "vaibhav@gmail.com",
        "customerApplicationFile": 217,
        "isApplicationSubmittedBR": true,
        "isQuoteAcceptRO": null,
        "finalizedAggregatorName": null,
        "selectedAggregatorName": null,
        "rccContactPersonName": null,
        "mobileNo": 7418529630,
        "status": "applicationSubmitted",
        "isReviewByRO": true,
        "isQuoteAcceptReviewByCO": null,
        "purchaseOrderId": null,
        "reasonOfRejection": null,
        "authorisedPersonName": null,
        "address": "Chembur",
        "rhRecommendationFile": null,
        "isReviewByZO": true,
        "isFinalApproved": null,
        "createdByBRId": "54829",
        "regionId": 2354,
        "authorisedPersonDesignation": null,
        "integrateWith": "onepay.com",
        "zhRecommendationFile": null,
        "isReviewByCO": true,
        "isDeleted": false,
        "approvedByROId": null,
        "branchId": 729,
        "branchName": null,
        "customerName": "Vaibhav Real Estate",
        "category": "Construction & Real Estate",
        "customerAcceptanceFile": null,
        "isAggregatorAdded": null,
        "totalAnnualTransaction": 1950000,
        "approvedByZOId": null,
        "zoneId": 1104,
        "regionName": null,
        "avgTransactionYearly": 1500,
        "kycFile": 216,
        "isQuoteAddedPA": null,
        "totalBankCollection": 1950000,
        "approvedByCOId": null,
        "createdAt": "2026-02-25T18:41:46",
        "accountNo": 7418520,
        "avgTransactionSize": 1300,
        "isQuoteReviewCO": null,
        "aggregateDepositAmt": 1950000,
        "approvedByQuoteId": null,
        "rccMailId": null
    },
    {
        "averageBalance": 22221,
        "applicationId": 204,
        "accountBalanceToday": 100000,
        "projection": "UPI|Internet banking|Credit card|Debit card",
        "isMarkUpAddedCO": true,
        "finalizedAggregatorId": 122,
        "selectedAggregatorId": null,
        "rccMobileNo": 7418526300,
        "userType": "existing",
        "email": "sunygengaje@gmail.com",
        "customerApplicationFile": 213,
        "isApplicationSubmittedBR": true,
        "isQuoteAcceptRO": true,
        "finalizedAggregatorName": "Info Tech Solutions",
        "selectedAggregatorName": null,
        "rccContactPersonName": null,
        "mobileNo": 7972676344,
        "status": "completed",
        "isReviewByRO": true,
        "isQuoteAcceptReviewByCO": true,
        "purchaseOrderId": null,
        "reasonOfRejection": null,
        "authorisedPersonName": null,
        "address": "thane",
        "rhRecommendationFile": 215,
        "isReviewByZO": null,
        "isFinalApproved": true,
        "createdByBRId": "54829",
        "regionId": 2354,
        "authorisedPersonDesignation": null,
        "integrateWith": "cedge.in",
        "zhRecommendationFile": null,
        "isReviewByCO": true,
        "isDeleted": false,
        "approvedByROId": "54868",
        "branchId": 729,
        "branchName": null,
        "customerName": "cedge technologies",
        "category": "Information Technology",
        "customerAcceptanceFile": 214,
        "isAggregatorAdded": null,
        "totalAnnualTransaction": 1000000,
        "approvedByZOId": "115019",
        "zoneId": 1104,
        "regionName": null,
        "avgTransactionYearly": 1000,
        "kycFile": 211,
        "isQuoteAddedPA": null,
        "totalBankCollection": 1000000,
        "approvedByCOId": "115019",
        "createdAt": "2026-02-25T16:55:55",
        "accountNo": 11111111111,
        "avgTransactionSize": 1000,
        "isQuoteReviewCO": true,
        "aggregateDepositAmt": 1000000,
        "approvedByQuoteId": "54868",
        "rccMailId": null
    },
    {
        "averageBalance": 879797,
        "applicationId": 203,
        "accountBalanceToday": 58700,
        "projection": "Debit card|Credit card|UPI|Internet banking",
        "isMarkUpAddedCO": null,
        "finalizedAggregatorId": null,
        "selectedAggregatorId": null,
        "rccMobileNo": null,
        "userType": "existing",
        "email": "sies@gmail.com",
        "customerApplicationFile": 210,
        "isApplicationSubmittedBR": true,
        "isQuoteAcceptRO": null,
        "finalizedAggregatorName": null,
        "selectedAggregatorName": null,
        "rccContactPersonName": null,
        "mobileNo": 7418528500,
        "status": "quoterequested",
        "isReviewByRO": true,
        "isQuoteAcceptReviewByCO": null,
        "purchaseOrderId": null,
        "reasonOfRejection": null,
        "authorisedPersonName": null,
        "address": "Sion, Mumbai",
        "rhRecommendationFile": null,
        "isReviewByZO": null,
        "isFinalApproved": null,
        "createdByBRId": "54829",
        "regionId": 2354,
        "authorisedPersonDesignation": null,
        "integrateWith": "sies.edu.in",
        "zhRecommendationFile": null,
        "isReviewByCO": true,
        "isDeleted": false,
        "approvedByROId": "54868",
        "branchId": 729,
        "branchName": null,
        "customerName": "SIES Institute",
        "category": "Education & Training",
        "customerAcceptanceFile": null,
        "isAggregatorAdded": null,
        "totalAnnualTransaction": 673833280762689,
        "approvedByZOId": "115019",
        "zoneId": 1104,
        "regionName": null,
        "avgTransactionYearly": 878797967,
        "kycFile": 209,
        "isQuoteAddedPA": null,
        "totalBankCollection": 673833280762689,
        "approvedByCOId": null,
        "createdAt": "2026-02-23T11:40:13",
        "accountNo": 7418520,
        "avgTransactionSize": 766767,
        "isQuoteReviewCO": null,
        "aggregateDepositAmt": 673833280762689,
        "approvedByQuoteId": null,
        "rccMailId": null
    },
    {
        "averageBalance": 741852,
        "applicationId": 202,
        "accountBalanceToday": 78888,
        "projection": "Debit card|Credit card|UPI|Internet banking",
        "isMarkUpAddedCO": true,
        "finalizedAggregatorId": 122,
        "selectedAggregatorId": null,
        "rccMobileNo": 7418526000,
        "userType": "existing",
        "email": "terna@gmail.com",
        "customerApplicationFile": 204,
        "isApplicationSubmittedBR": true,
        "isQuoteAcceptRO": true,
        "finalizedAggregatorName": "Info Tech Solutions",
        "selectedAggregatorName": null,
        "rccContactPersonName": "Tushar Kasbe",
        "mobileNo": 7415263000,
        "status": "completed",
        "isReviewByRO": true,
        "isQuoteAcceptReviewByCO": true,
        "purchaseOrderId": null,
        "reasonOfRejection": null,
        "authorisedPersonName": "Roshan Singh",
        "address": "Mumbai",
        "rhRecommendationFile": 206,
        "isReviewByZO": null,
        "isFinalApproved": true,
        "createdByBRId": "54829",
        "regionId": 2354,
        "authorisedPersonDesignation": "Assistant Manager",
        "integrateWith": "terna.edu.in",
        "zhRecommendationFile": null,
        "isReviewByCO": true,
        "isDeleted": false,
        "approvedByROId": "54868",
        "branchId": 729,
        "branchName": "Chembur",
        "customerName": "Terna Engineering College",
        "category": "Education & Training",
        "customerAcceptanceFile": 205,
        "isAggregatorAdded": null,
        "totalAnnualTransaction": 1950000,
        "approvedByZOId": "115019",
        "zoneId": 1104,
        "regionName": "Mumbai",
        "avgTransactionYearly": 1500,
        "kycFile": 203,
        "isQuoteAddedPA": null,
        "totalBankCollection": 1950000,
        "approvedByCOId": "115019",
        "createdAt": "2026-02-21T15:21:24",
        "accountNo": 7418520,
        "avgTransactionSize": 1300,
        "isQuoteReviewCO": true,
        "aggregateDepositAmt": 1950000,
        "approvedByQuoteId": "54868",
        "rccMailId": "tushar@gmail.com"
    }
])

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