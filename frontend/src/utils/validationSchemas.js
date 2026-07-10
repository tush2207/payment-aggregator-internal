import { isBO, isRO } from "&src/constants/PaymentAggregratorConstant";
import * as Yup from "yup";

// Alphanumeric regex (allows letters and numbers only, no special characters)
export const isAlphanumeric = /^[a-zA-Z0-9]+$/;

// Pass regex (at least 8 characters, one uppercase, one lowercase, one number, and one special character)
export const isPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export const isAlphaNumeric = (str) => /^[a-z0-9]+$/i.test(str);

export const loginSchema = Yup.object().shape({
  username: Yup.string()
    .trim()
    .matches(/^[a-zA-Z0-9._-]{4,20}$/,
      "Username must be 4–20 characters and can only contain letters, numbers, dots, underscores, or hyphens."
    )
    .required("Username is required"),

  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(32, "Password cannot exceed 32 characters")
});

export const applicationFormSchema = (user_role) => {
  return Yup.object().shape({
    userType: Yup.string().required("User Type is required"),

    customerName: Yup.string()
      .required("Customer Name is required")
      .matches(/^[A-Za-z ]+$/, "Only alphabets are allowed")
      .min(2, "Name must be at least 2 characters")
      .max(100, "Customer Name must be under 100 characters"),

    accountNo: Yup.string().when("userType", {
      is: (val) => val !== "new",
      then: (schema) =>
        schema
          .required("Account number is required")
          .matches(/^[0-9]+$/, "Account number must be numeric"),
      otherwise: (schema) => schema.notRequired().nullable(),
    }),

    averageBalance: Yup.number()
      .typeError("Average Balance must be a number")
      .required("Average Balance is required")
      .min(1000, "Average Balance must be at least ₹1000"),

    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),

    mobileNo: Yup.string()
      .matches(/^[6-9]\d{9}$/, "Mobile number must be valid")
      .required("Mobile Number is required"),

    address: Yup.string()
      .required("Address is required")
      .max(200, "Address should be under 200 characters"),

    integrateWith: Yup.string()
      .required("Integrate With is required")
      .max(100, "Integrate With must be under 100 characters"),

    category: Yup.string().required("Category is required"),

    projection: Yup.string().required("At least one projection must be selected"),

    avgTransactionYearly: Yup.number()
      .typeError("Average Transactions must be a number")
      .required("Average Transactions (Yearly) is required")
      .min(100, "Average Transactions must be at least 100"),

    avgTransactionSize: Yup.number()
      .typeError("Ticket Size must be a number")
      .required("Average Ticket Size (Yearly) is required")
      .min(500, "Average Ticket Size must be at least ₹500"),

    accountBalanceToday: Yup.number()
      .typeError("Account Balance must be a number")
      .required("Account Balance is required")
      .min(1000, "Account Balance must be at least ₹1000"),

    // 🔹 Conditionally add file validations based on role
    ...(isBO
      ? {
        kycFile: Yup.mixed().required("KYC File is required"),
        customerApplicationFile: Yup.mixed().required(
          "Customer Application File is required"
        ),
      }
      : {}),

    ...(isRO
      ? {
        rhRecommendationFile: Yup.mixed().required(
          "RH Recommendation File is required"
        ),
      }
      : {}),
  });
};

export const aggregatorFormSchema = Yup.object().shape({
  aggregatorName: Yup.string()
    .trim()
    .matches(/^[A-Za-z0-9 ]+$/, "Only alphabets are allowed")
    .min(2, "Name must be at least 2 characters")
    .required("Full name is required."),
  contactPersonName: Yup.string()
    .trim()
    .matches(/^[A-Za-z0-9 ]+$/, "Only alphabets are allowed")
    .min(2, "Name must be at least 2 characters")
    .required("Contact person name is required."),
  email: Yup.string()
    .trim()
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/,
      "Enter a valid email address"
    )
    .required("Email is required"),
  mobileNo: Yup.string()
    .trim()
    .matches(/^[6-9]\d{9}$/, 'Mobile number must be valid')
    .required('Mobile number is required'),

  location: Yup.string()
    .trim()
    .required("Address is required")
    .max(200, "Address should be under 200 characters"),

});

export const poFormSchema = Yup.object().shape({
  branchName: Yup.string()
  .required("Branch name is required."),

  regionName: Yup.string()
  .required("Region name is required."),

  rccContactPersonName: Yup.string()
    .trim()
    .matches(/^[A-Za-z0-9 ]+$/, "Only alphabets are allowed")
    .min(2, "Name must be at least 2 characters")
    .required("Contact person name is required."),

    rccMailId: Yup.string()
    .trim()
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/,
      "Enter a valid email address"
    )
    .required("RCC Mail is required"),

  rccMobileNo: Yup.string()
    .trim()
    .matches(/^[6-9]\d{9}$/, 'Mobile number must be valid')
    .required('Mobile number is required'),

  authorisedPersonName: Yup.string()
    .trim()
    .matches(/^[A-Za-z0-9 ]+$/, "Only alphabets are allowed")
    .min(2, "Name must be at least 2 characters")
    .required("Authorised Person name is required."),

  authorisedPersonDesignation: Yup.string().required("Authorised Person Designation is required."),

});

export const helpDeskFormSchema = Yup.object({
    ticketName: Yup.string().required('Ticket Name is required'),
    priority: Yup.string().oneOf(['low', 'medium', 'high']).required('Priority is required'),
    customerName: Yup.string().required('Customer Name is required'),
    customerEmail: Yup.string().email('Invalid email').required('Email is required'),
    customerMobileNo: Yup.string()
        .matches(/^\d{10}$/, 'Mobile number must be 10 digits')
        .required('Mobile number is required'),
    accountNo: Yup.string().required('Account Number is required'),
    branchName: Yup.string().required('Branch is required'),
    zoneName: Yup.string().required('Zone is required'),
    regionName: Yup.string().required('Region is required'),
    description: Yup.string().required('Description is required'),
    applicationNo: Yup.string().required('Application Number is Required'),
});