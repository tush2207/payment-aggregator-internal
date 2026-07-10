import React from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@mui/material';
import clsx from 'clsx'; // You can use clsx to merge class names

const PageTitle = ({ title, className, ...props }) => (
  <Typography
    className={clsx(
      'md:ml-0 md:mt-0 mt-8 mb-0 font-semibold underline md:text-[20px] text-[18px] uppercase pt-0',
      className
    )}
    {...props}
  >
    {title}
  </Typography>
);

PageTitle.propTypes = {
  title: PropTypes.string.isRequired,
  className: PropTypes.string,
};

PageTitle.defaultProps = {
  className: '',
};

export default PageTitle;
