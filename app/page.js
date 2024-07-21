'use client';
import ChatBox from './components/ChatBox';
import ParticlesBackground from './components/ParticlesBackground';


export default function Chat() {
  return (
    <div className=' relative h-full'>
      <div className="background noise absolute w-full h-full flex justify-center items-center">
        <ParticlesBackground />
      </div>
      <div className='h-full w-full p-32'>
        <ChatBox />
      </div>
    </div>
  );
}