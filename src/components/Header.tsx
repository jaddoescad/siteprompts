import React from 'react';
import PageContainer from './PageContainer';


export default function Header() {
  return (
    <header className='border-b p-4'>
      <PageContainer>
        <div className='flex w-full items-center justify-between'>
          <div className='flex items-center gap-2'>
            <h1 className='bg-gradient-to-br from-red-400 to-blue-600 bg-clip-text text-2xl font-bold text-transparent'>
              BLOCKUI
            </h1>
          </div>
        </div>
      </PageContainer>
    </header>
  );
}
