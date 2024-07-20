'use client';

import { useChat } from 'ai/react';
import { useEffect } from 'react';

let lastUpdate = 0;
let currentMouseX = 0;
let currentMouseY = 0;

const updateDelay = 50;

let periodCounter = 0;
const periodDuration = 1000; // Duration of one period in milliseconds
const bulges = 20;
const vertices = 500;
let randomAmplitudes = new Array(vertices).fill(0).map(() => Math.random() * 15 + 5);
let randomOffsets = new Array(vertices).fill(0).map(() => Math.random() * Math.PI * 2);
let randomRadiuses = new Array(vertices).fill(0).map(() => Math.random() * 10);




function UpdateBackground(e) {
  //only allow updates every 10ms
  if (Date.now() - lastUpdate < updateDelay) {
    return;
  }

  const blob = document.querySelector('.blob');
  const mouseX = e.clientX;
  const mouseY = e.clientY;

  currentMouseX = mouseX;
  currentMouseY = mouseY;

  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  const centerX = windowWidth / 2;
  const centerY = windowHeight / 2;

  const vertices = 800;
  const stretchFactor = 1;
  const stretchDistance = 15;
  const concavityFactor = 0.6;

  const blobSize = 20;
  let numberOfAffectedVertices = 100;

  blob.style.width = `100%`;
  blob.style.height = `100%`;
  blob.style.aspectRatio = `1/1`;

  let closestVertexIndex = -1;
  let minDistanceToCursor = Infinity;

  const distanceX = mouseX - centerX;
  const distanceY = mouseY - centerY;

  let randomAmplitude = Math.random() * 15 + 5; // Random amplitude for the sine wave
  let randomOffset = Math.random() * Math.PI * 2; // Random phase offset for the sine wave

  // Generate blob shape
  const points = Array.from({ length: vertices }, (_, i) => {
      const angle = (i / vertices) * Math.PI * 2;
      const bulges = 20;
      let randomOffset = Math.random() * 0.2 - 0.05;
      let radius = blobSize + Math.sin(angle * bulges + Date.now() / 1000) * (concavityFactor);
      let newRadius = radius
      const vertexX = centerX + newRadius * Math.cos(angle);
      const vertexY = centerY + newRadius * Math.sin(angle);

      // Calculate distance from vertex to cursor
      const distanceToCursor = Math.sqrt(Math.pow(mouseX - vertexX, 2) + Math.pow(mouseY - vertexY, 2));

      if (distanceToCursor < minDistanceToCursor) {
          minDistanceToCursor = distanceToCursor;
          closestVertexIndex = i;
      }

      return {
          x: vertexX,
          y: vertexY,
          radius,
          angle,
          distanceToCursor
      };
  });

  // Stretch the vertices
  const stretchedPoints = points.map((point, i) => {
      const distanceIndex = (i - closestVertexIndex + vertices) % vertices;
      const indexDifference = Math.abs(closestVertexIndex - i) % vertices;

      let stretchMultiplier = 0;

      if (distanceIndex < numberOfAffectedVertices) {
        stretchMultiplier = 1 - (distanceIndex / numberOfAffectedVertices) * stretchFactor;
      } else if (distanceIndex > vertices - numberOfAffectedVertices) {
        stretchMultiplier = 1 - (indexDifference / numberOfAffectedVertices) * stretchFactor;
        if (indexDifference > closestVertexIndex) {
          console.log('using special case');
          const flippedIndex = vertices - indexDifference;
          console.log('flippedIndex', flippedIndex);
          stretchMultiplier = 1 - (flippedIndex / numberOfAffectedVertices) * stretchFactor;
        }
      }

      if (point.distanceToCursor < 0) {
        console.log('point.distanceToCursor', point.distanceToCursor);
      }

      let maxDistance = Math.min(point.distanceToCursor, stretchDistance);

      const newRadius = point.radius + Math.abs((10 - maxDistance) * stretchMultiplier)// + randomOffset;

      let xPercent = 50 + newRadius * Math.cos(point.angle);
      let yPercent = 50 + newRadius * Math.sin(point.angle);

      if (i === vertices - 1) {
        console.log('distanceToCursor', point.distanceToCursor);
        console.log('newRadius', newRadius);
        console.log('originalRadius', point.radius);
        console.log('stretchMultiplier', stretchMultiplier);
        console.log('indexDifference', indexDifference);
        console.log('distanceIndex', distanceIndex);
      }

      return `${xPercent}% ${yPercent}%`;

  }).join(', ');
  lastUpdate = Date.now();

  blob.style.clipPath = `polygon(${stretchedPoints})`;
}

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  useEffect(() => {
    window.addEventListener('mousemove', UpdateBackground);
    setInterval(() => {
      // Simulate a mousemove event to update the blob
      // @ts-ignore
      const event = new MouseEvent('mousemove', {
        clientX: currentMouseX,
        clientY: currentMouseY
      });
      UpdateBackground(event);
    }, updateDelay);

    window.addEventListener('mouseleave', () => {
      currentMouseX = window.innerWidth / 2;
      currentMouseY = window.innerHeight / 2;
    }
    );
    
    return (() => {
      window.removeEventListener('mousemove', UpdateBackground);
    })
  }, []);
  return (
    <>
    <div className="background noise absolute w-full h-full flex justify-center items-center">
    <div className="blob" style={{background: 'radial-gradient(circle at center, rgba(169, 169, 169, 1) 0%, rgba(169, 169, 169, 0) 40%, rgba(169, 169, 169, 0) 100%) !important', filter:'blur(20px)'}}></div>
    </div>
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(m => (
        <div key={m.id} className="whitespace-pre-wrap">
          {m.role === 'user' ? 'User: ' : 'AI: '}
          {m.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
    </>
  );
}