export default function UserChatBubble({ children }) {
    return (
        <div className="flex justify-end">
            <div className="bg-blue-500 text-white p-2 rounded-lg">
                {children}
            </div>
        </div>
    )
}