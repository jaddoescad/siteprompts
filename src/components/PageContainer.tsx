import React, { ReactElement } from 'react';

interface IProps {
  children: ReactElement;
}

export default function PageContainer({ children }: IProps) {
  return <div className='mx-auto w-full max-w-7xl'>{children}</div>;
}
