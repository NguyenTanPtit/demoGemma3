import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../logic/blocs/work/work_bloc.dart';
import '../../data/models/work_entity.dart';

class SearchWorkScreen extends StatefulWidget {
  const SearchWorkScreen({Key? key}) : super(key: key);

  @override
  State<SearchWorkScreen> createState() => _SearchWorkScreenState();
}

class _SearchWorkScreenState extends State<SearchWorkScreen> {
  @override
  void initState() {
    super.initState();
    context.read<WorkBloc>().add(const LoadWorks());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Work Orders')),
      body: Column(
        children: [
          // Filter Section (Simplified)
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(child: TextField(decoration: InputDecoration(hintText: 'Search...', border: OutlineInputBorder()))),
                IconButton(icon: const Icon(Icons.filter_list), onPressed: () {}),
              ],
            ),
          ),
          Expanded(
            child: BlocBuilder<WorkBloc, WorkState>(
              builder: (context, state) {
                if (state is WorkLoading) {
                  return const Center(child: CircularProgressIndicator());
                } else if (state is WorkError) {
                  return Center(child: Text('Error: ${state.message}'));
                } else if (state is WorkLoaded) {
                  return ListView.builder(
                    itemCount: state.works.length,
                    itemBuilder: (context, index) {
                      final work = state.works[index];
                      return _buildWorkItem(work);
                    },
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWorkItem(WorkEntity work) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      child: ListTile(
        title: Text(work.workCode, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(work.workDescription ?? 'No description'),
            const SizedBox(height: 5),
            Row(
              children: [
                Chip(label: Text(work.workStatusName ?? 'N/A', style: const TextStyle(fontSize: 10))),
                const SizedBox(width: 5),
                Text(work.workStaffName ?? '', style: const TextStyle(color: Colors.grey)),
              ],
            )
          ],
        ),
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }
}
