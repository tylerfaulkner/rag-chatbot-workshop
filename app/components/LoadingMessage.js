import BotChatBubble from './BotChatBubble';
import { ScaleLoader } from 'react-spinners';

export default function LoadingMessage() {
    return (
        <div className="flex justify-start">
            <div className="bg-gray-500 text-white p-2 rounded-lg">
                <ScaleLoader color="#000000" />
            </div>
        </div>
    )
}