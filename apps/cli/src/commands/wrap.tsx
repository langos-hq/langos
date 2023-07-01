import {useEffect, useReducer, useRef, useState} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import zod from 'zod';
import {Wrapper} from '@langos/wrap';
import path from 'node:path';
import {useRerender} from '../hooks/useRerender.js';

export const options = zod.object({
	directory: zod.string().describe('Directory with a tsconfig.json'),
});

type Props = {
	options: zod.infer<typeof options>;
};

export default function Wrap({options}: Props) {
	const app = useApp();

	const rerender = useRerender();
	const [wrapper] = useState(
		() =>
			new Wrapper({
				tsConfigFilePath: path.resolve(
					process.cwd(),
					options.directory,
					'tsconfig.json',
				),
				onChange: () => rerender(),
			}),
	);

	useEffect(() => {
		if (wrapper.done) {
			app.exit();
		}
	}, [wrapper.done]);

	useInput((input, key) => {
		if (key.return) {
			wrapper.next();
		}
	});

	const hasMore = wrapper.filesCount > wrapper.processedFilesCount;

	return (
		<Box flexDirection="column">
			<Text>
				Processed {wrapper.processedFilesCount} / {wrapper.filesCount}
			</Text>
			{!!wrapper.currentFile && (
				<>
					<Box>
						<Box paddingX={2} borderColor="yellow" borderStyle="single">
							<Text color="yellow">
								Wrapping file:{' '}
								{path.relative(process.cwd(), wrapper.currentFile.path)}
							</Text>
						</Box>
					</Box>
					{'wraps' in wrapper.currentFile && (
						<Box flexDirection="column" gap={1}>
							{wrapper.currentFile.wraps.map(wrap => (
								<Box key={wrap.before} flexDirection="column">
									<Text color="red">- {wrap.before}</Text>
									<Text color="green">+ {wrap.after}</Text>
								</Box>
							))}
						</Box>
					)}
				</>
			)}
			<Box marginTop={1}>
				<Text>
					{hasMore ? 'Press enter to continue.' : 'Press enter to finish.'}
				</Text>
			</Box>
		</Box>
	);
}
