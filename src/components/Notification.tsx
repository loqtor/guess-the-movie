import React from 'react';

interface Props {
  classes?: string;
  children: React.ReactNode;
}

export const Notification = (props: Props) => {
  const { classes, children } = props;

  return (
    <div className={`Notification ${classes}`}>
      {children}
    </div>
  )
};