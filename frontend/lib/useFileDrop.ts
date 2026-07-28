import React from 'react';

/**
 * Drag-and-drop file target: spread `props` on the drop area, use `over` for the
 * highlight. ponytail: first file only — every upload in this app is single-file.
 */
export function useFileDrop(onFile: (file: File) => void) {
  const [over, setOver] = React.useState(false);
  return {
    over,
    props: {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        setOver(true);
      },
      onDragLeave: () => setOver(false),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      },
    },
  };
}
