import { baseApi } from "../baseApi";
import { setUser, setLoading } from "../../authSlice";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (body) => ({
        url: "/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    register: builder.mutation({
      query: (body) => ({
        url: "/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    googleGateway: builder.mutation({
      query: (body) => ({
        url: "/google-getway",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    getUserInfo: builder.query({
      query: () => ({
        url: "/getuserinfo",
        method: "GET",
      }),
      providesTags: ["User"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(setLoading(true));
        try {
          const { data } = await queryFulfilled;
          dispatch(setUser(data.user));
        } catch {
          dispatch(setUser(null));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/user/logout",
        method: "GET",
      }),
      invalidatesTags: ["User"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGoogleGatewayMutation,
  useGetUserInfoQuery,
  useLogoutMutation,
} = authApi;
