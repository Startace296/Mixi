export default function FloatingInput({
    type = 'text',
    value,
    onChange,
    label,
    readOnly,
    error,
    ...props
  }) {
    const hasError = Boolean(error);
    return (
      <div className="flex flex-col gap-1.5 relative">
        <input
          type={type}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          readOnly={readOnly}
          placeholder=" "
          className={`peer pt-6 px-4 pb-4 rounded-xl border bg-white text-[#1c1e21] text-base outline-none transition-[border-color] duration-150 placeholder:text-transparent ${
            readOnly ? 'bg-[#f3f4f6] text-[#6b7280] cursor-not-allowed' : ''
          } ${hasError ? 'border-red-500 focus:border-red-500' : 'border-[#dddfe2] focus:border-indigo-600'}`}
          {...props}
        />
        <label className={`absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none transition-all duration-200 ease-out peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs ${
          hasError ? 'text-red-500 peer-focus:text-red-500' : 'text-[#90949c] peer-focus:text-indigo-600 peer-[:not(:placeholder-shown)]:text-indigo-600'
        }`}>
          {label}
        </label>
        {hasError && <span className="text-sm text-red-500">{error}</span>}
      </div>
    );
  }