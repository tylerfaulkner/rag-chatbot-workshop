import Markdown from "react-markdown"

export default function BotChatBubble({ children }) {
    return (
        <div className="flex justify-start">
            <div className="bg-gray-500 text-white p-2 rounded-lg">
                <Markdown
                    components={{
                        a(props) {
                            const { children, className, ...rest } = props
                            return <a {...props} className={"text-blue-400 hover:underline"} target="_blank" >{children}</a>
                        }
                    }}
                >{children}</Markdown>
            </div>
        </div>
    )
}