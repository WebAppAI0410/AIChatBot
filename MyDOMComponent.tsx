    // MyDOMComponent.tsx
    'use dom';

    export default function MyDOMComponent({ name }: { name: string }) {
      return (
        <div style={{ padding: 20, backgroundColor: 'lightgreen' }}>
          <h1>Hello from DOM, {name}!</h1>
          <p>This is a React DOM component rendered in a native app.</p>
        </div>
      );
    }