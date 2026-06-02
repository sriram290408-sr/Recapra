import React from "react";

const ProfileAvatar = ({ name = "", size = 40 }) => {
  const getInitials = (fullName) => {
    if (!fullName) return "U";
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div
      className="flex items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-bold tracking-wider select-none shrink-0"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${size * 0.38}px`
      }}
    >
      {getInitials(name)}
    </div>
  );
};

export default ProfileAvatar;
