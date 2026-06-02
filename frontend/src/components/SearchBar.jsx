import React from "react";
import { Search, MapPin, Briefcase } from "lucide-react";
import Button from "./Button";

const SearchBar = ({
  searchQuery,
  onSearchChange,
  locationQuery,
  onLocationChange,
  jobTypeQuery,
  onJobTypeChange,
  workModeQuery,
  onWorkModeChange,
  onSearchSubmit,
  placeholder = "Search jobs, roles, or skills..."
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit();
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 animate-fade-in"
    >
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
        {/* Main query */}
        <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 transition-all duration-200">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            type="text"
            className="w-full border-none bg-transparent text-sm text-slate-800 focus:outline-none focus:ring-0 placeholder:text-slate-400 font-medium"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Location (optional) */}
        {onLocationChange && (
          <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 transition-all duration-200">
            <MapPin size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              className="w-full border-none bg-transparent text-sm text-slate-800 focus:outline-none focus:ring-0 placeholder:text-slate-400 font-medium"
              placeholder="City, state, or remote..."
              value={locationQuery}
              onChange={(e) => onLocationChange(e.target.value)}
            />
          </div>
        )}

        {/* Job Type select (optional) */}
        {onJobTypeChange && (
          <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 transition-all duration-200">
            <Briefcase size={18} className="text-slate-400 shrink-0" />
            <select
              className="w-full border-none bg-transparent text-sm text-slate-800 focus:outline-none focus:ring-0 font-medium cursor-pointer"
              value={jobTypeQuery}
              onChange={(e) => onJobTypeChange(e.target.value)}
            >
              <option value="">All Job Types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="internship">Internship</option>
              <option value="contract">Contract</option>
            </select>
          </div>
        )}

        {/* Work Mode select (optional) */}
        {onWorkModeChange && (
          <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 transition-all duration-200">
            <Briefcase size={18} className="text-slate-400 shrink-0 opacity-0 md:block hidden" />
            <select
              className="w-full border-none bg-transparent text-sm text-slate-800 focus:outline-none focus:ring-0 font-medium cursor-pointer"
              value={workModeQuery}
              onChange={(e) => onWorkModeChange(e.target.value)}
            >
              <option value="">All Work Modes</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </div>
        )}
      </div>

      <Button type="submit" variant="primary" size="md" className="shrink-0 lg:w-36 shadow-xs">
        Find Jobs
      </Button>
    </form>
  );
};

export default SearchBar;
