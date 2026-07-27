import { createAction } from "@reduxjs/toolkit";

// Define action creators
export const loadUserSuccess = createAction("LoadUserSuccess");
export const loadUserFail = createAction("LoadUserFail");

export const updateUserInfoSuccess = createAction("updateUserInfoSuccess");
export const updateUserInfoFailed = createAction("updateUserInfoFailed");

export const updateUserAddressSuccess = createAction("updateUserAddressSuccess");
export const updateUserAddressFailed = createAction("updateUserAddressFailed");

export const deleteUserAddressSuccess = createAction("deleteUserAddressSuccess");
export const deleteUserAddressFailed = createAction("deleteUserAddressFailed");

export const getAllUsersSuccess = createAction("getAllUsersSuccess");
export const getAllUsersFailed = createAction("getAllUsersFailed");
