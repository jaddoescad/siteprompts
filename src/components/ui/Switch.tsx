export const Switch = ({ checked, onChange, label }) => (
    <label className="flex items-center cursor-pointer">
      <div className="relative px-4">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={onChange}
        />
      </div>
      <div className="ml-3 text-gray-700 font-medium">
        {label}
      </div>
    </label>
  );