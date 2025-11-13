import { baseApi } from "../baseApi";

export const userApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Face Authentication Endpoints
        getFaceAuthStatus: builder.query({
            query: () => ({
                url: "/user/face/status",
                method: "GET",
            }),
            providesTags: ["Settings"],
        }),
        registerFace: builder.mutation({
            query: (body) => ({
                url: "/user/face/register",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Settings"],
        }),
        unregisterFace: builder.mutation({
            query: () => ({
                url: "/user/face/unregister",
                method: "DELETE",
            }),
            invalidatesTags: ["Settings"],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetFaceAuthStatusQuery,
    useRegisterFaceMutation,
    useUnregisterFaceMutation,
} = userApi;
