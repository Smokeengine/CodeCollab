interface InputProps {
  type?: string
  className?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const Input = ({type, className, placeholder, value, onChange}: InputProps) => {
  return (
    <div>
      <input type={type} className={` w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500 ${className}`} placeholder={placeholder} onChange={onChange} value={value}  />
    </div>
  )
}

export default Input
