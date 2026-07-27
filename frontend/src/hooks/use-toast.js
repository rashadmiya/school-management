import { toast } from "sonner";

export function useToast() {
  return {
    toast: ({ title, description, variant = "default" }) => {
      // Sonner uses different methods for different "variants"
      const options = {
        description: description,
      };

      if (variant === "destructive" || variant === "error") {
        return toast.error(title, options);
      }

      if (variant === "success") {
        return toast.success(title, options);
      }

      // Default/Info toast
      return toast(title, options);
    },
  };
}

// import { toast as notify } from 'react-toastify';
// export function useToast() {
//   return {
//     toast: ({ title, description, variant = "default" || "success" || "destructive" }) => {
//       const message = description || title;

//       switch (variant) {
//         case 'destructive':
//           notify.error(message);
//           break;

//         case 'success':
//           notify.success(message);
//           break;

//         case 'warning':
//           notify.warning(message);
//           break;

//         default:
//           notify(message);
//       }
//     }
//   };
// }

// import { toast as notify } from 'react-toastify';

// export function useToast() {
//   return {
//     toast: ({ title, description, variant = 'default' }) => {
//       const message = description || title;

//       switch (variant) {
//         case 'destructive':
//           notify.error(message);
//           break;

//         case 'success':
//           notify.success(message);
//           break;

//         case 'warning':
//           notify.warning(message);
//           break;

//         default:
//           notify(message);
//       }
//     }
//   };
// }
