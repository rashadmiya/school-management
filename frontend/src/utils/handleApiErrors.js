// 1. Import 'toast' directly from sonner (not the hook)
import { toast } from "sonner"; 

export function handleApiError(error) {

    let title = "Request failed";
    let description = "Something went wrong";

    const message =
        error?.data?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "";

    if (message) {
        description = message;

        if (message.includes("5MB")) {
            title = "Image too large";
        } else if (message.toLowerCase().includes("valid image")) {
            title = "Invalid file type";
        } else if (message.toLowerCase().includes("not found")) {
            title = "Not found";
        } else if (message.toLowerCase().includes("already exists")) {
            title = "Duplicate entry";
        }
    }

    // 2. Use the sonner API
    toast.error(title, {
        description: description,
    });
}

// export function handleApiError(error, toast) {
//     // Default values
//     let title = "Something went wrong";
//     let description = "Please try again later";

//     console.log("error :", error)
//     // RTK Query / Axios / Fetch compatible
//     const message =
//         error?.data?.message ||
//         error?.response?.data?.message ||
//         error?.message ||
//         "";

//     if (message) {
//         description = message;

//         if (message.includes("5MB")) {
//             title = "Image too large";
//         } else if (message.toLowerCase().includes("valid image")) {
//             title = "Invalid file type";
//         } else if (message.toLowerCase().includes("permission")) {
//             title = "Permission denied";
//         } else if (message.toLowerCase().includes("not found")) {
//             title = "Not found";
//         } else if (message.toLowerCase().includes("already exists")) {
//             title = "Duplicate entry";
//         } else {
//             title = "Request failed";
//         }
//     }

//     toast({
//         title,
//         description,
//         variant: "destructive",
//     });
// }