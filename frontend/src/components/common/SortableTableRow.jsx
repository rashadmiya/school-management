// components/common/SortableTableRow.jsx
import { TableCell, TableRow } from "@/components/ui/table";
import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SortableTableRow({
    id,
    children,
    dragHandle = true,
    className = "",
    onClick = null,
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Return TableRow directly, not wrapped in a div
    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className={className}
            onClick={onClick}
        >
            {dragHandle && (
                <TableCell className="w-10">
                    <div {...attributes} {...listeners} className="cursor-grab hover:text-blue-500 inline-flex">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                    </div>
                </TableCell>
            )}
            {children}
        </TableRow>
    );
}

// // components/common/SortableTableRow.jsx
// import { TableCell, TableRow } from "@/components/ui/table";
// import { GripVertical } from "lucide-react";
// import { useSortable } from "@dnd-kit/sortable";
// import { CSS } from "@dnd-kit/utilities";

// export default function SortableTableRow({
//     id,
//     children,
//     dragHandle = true,
//     className = "",
//     onClick = null,
// }) {
//     const {
//         attributes,
//         listeners,
//         setNodeRef,
//         transform,
//         transition,
//         isDragging,
//     } = useSortable({ id });

//     const style = {
//         transform: CSS.Transform.toString(transform),
//         transition,
//         opacity: isDragging ? 0.5 : 1,
//     };

//     return (
//         <div ref={setNodeRef} style={style} className={className}>
//             <TableRow onClick={onClick}>
//                 {dragHandle && (
//                     <TableCell className="w-10">
//                         <div {...attributes} {...listeners} className="cursor-grab hover:text-blue-500">
//                             <GripVertical className="w-4 h-4 text-gray-400" />
//                         </div>
//                     </TableCell>
//                 )}
//                 {children}
//             </TableRow>
//         </div>
//     );
// }