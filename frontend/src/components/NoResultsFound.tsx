import {
  PlusIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline'

interface Props {
  title: string
  description: string
  cta: string
  href: string
}

export const NoResultsFound: React.FC<Props> = ({
  title,
  description,
  cta,
  href,
}) => {
  return (
    <div className="text-center">
      <PresentationChartLineIcon className="mx-auto h-10" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <div className="mt-6">
        <a href={href}>
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            {cta}
          </button>
        </a>
      </div>
    </div>
  )
}
