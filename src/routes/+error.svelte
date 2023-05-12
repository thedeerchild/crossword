<script>
	import { page } from '$app/stores';

	console.error(`Error page shown for error:`, { route: $page.route.id, error: $page.error });
</script>

<h1>App Error</h1>
<p>{$page.error?.message}</p>
