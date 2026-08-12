"use client";

interface ModalProps extends React.PropsWithChildren {
  handleCloseModal: () => void;
  title: string;
  isOpen: boolean;

}

export default function Modal(props: ModalProps) {
  const { handleCloseModal, children, title, isOpen } = props;
  
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      < div 
        className="bg-[#1a1a1a] absolute top-[50%] p-6 rounded-lg max-w-md w-full border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {/* Close button notifies parent */}
          <button 
            onClick={handleCloseModal}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>
        { children }
      </div>
    </div>
  )
}