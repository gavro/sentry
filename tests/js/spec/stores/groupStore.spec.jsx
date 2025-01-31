import GroupStore from 'sentry/stores/groupStore';

describe('GroupStore', function () {
  beforeEach(function () {
    GroupStore.reset();
  });

  describe('add()', function () {
    it('should add new entries', function () {
      GroupStore.items = [];
      GroupStore.add([{id: 1}, {id: 2}]);

      expect(GroupStore.items).toEqual([{id: 1}, {id: 2}]);
    });

    it('should update matching existing entries', function () {
      GroupStore.items = [{id: 1}, {id: 2}];

      GroupStore.add([{id: 1, foo: 'bar'}, {id: 3}]);

      expect(GroupStore.items).toEqual([{id: 1, foo: 'bar'}, {id: 2}, {id: 3}]);
    });

    it('should attempt to preserve order of ids', function () {
      GroupStore.add([{id: 2}, {id: 1}, {id: 3}]);
      expect(GroupStore.getAllItemIds()).toEqual([2, 1, 3]);
    });
  });

  describe('remove()', function () {
    it('should remove entry', function () {
      GroupStore.items = [{id: 1}, {id: 2}];
      GroupStore.remove([1]);

      expect(GroupStore.items).toEqual([{id: 2}]);
    });

    it('should remove multiple entries', function () {
      GroupStore.items = [{id: 1}, {id: 2}, {id: 3}];
      GroupStore.remove([1, 2]);

      expect(GroupStore.items).toEqual([{id: 3}]);
    });

    it('should not remove already removed item', function () {
      GroupStore.items = [{id: 1}, {id: 2}];
      GroupStore.remove([0]);

      expect(GroupStore.items).toEqual([{id: 1}, {id: 2}]);
    });
  });

  describe('onMergeSuccess()', function () {
    it('should remove the non-parent merged ids', function () {
      GroupStore.items = [{id: 1}, {id: 2}, {id: 3}, {id: 4}];

      GroupStore.onMergeSuccess(
        null,
        [2, 3, 4], // items merged
        {merge: {parent: 3}} // merge API response
      );

      expect(GroupStore.items).toEqual([
        {id: 1},
        {id: 3}, // parent
      ]);
    });
  });

  describe('onPopulateStats()', function () {
    const stats = {auto: [[1611576000, 10]]};
    beforeAll(function () {
      jest.spyOn(GroupStore, 'trigger');
    });
    beforeEach(function () {
      GroupStore.trigger.mockReset();
      GroupStore.items = [{id: 1}, {id: 2}, {id: 3}];
    });

    it('should merge stats into existing groups', function () {
      GroupStore.onPopulateStats(
        [1, 2, 3],
        [
          {id: 1, stats},
          {id: 2, stats},
          {id: 3, stats},
        ]
      );
      expect(GroupStore.getAllItems()[0].stats).toEqual(stats);
      expect(GroupStore.trigger).toHaveBeenCalledWith(new Set([1, 2, 3]));
    });

    it('should not change current item ids', function () {
      GroupStore.onPopulateStats(
        [2, 3],
        [
          {id: 2, stats},
          {id: 3, stats},
        ]
      );
      expect(GroupStore.trigger).toHaveBeenCalledWith(new Set([1, 2, 3]));
      expect(GroupStore.getAllItems()[0].stats).toBeUndefined();
      expect(GroupStore.getAllItems()[1].stats).toEqual(stats);
    });
  });

  describe('update methods', function () {
    beforeAll(function () {
      jest.spyOn(GroupStore, 'trigger');
    });
    beforeEach(function () {
      GroupStore.trigger.mockReset();
    });

    beforeEach(function () {
      GroupStore.items = [{id: 1}, {id: 2}, {id: 3}];
    });

    describe('onUpdate()', function () {
      it("should treat undefined itemIds argument as 'all'", function () {
        GroupStore.onUpdate(1337, undefined, 'somedata');

        expect(GroupStore.trigger).toHaveBeenCalledTimes(1);
        expect(GroupStore.trigger).toHaveBeenCalledWith(new Set([1, 2, 3]));
      });
    });

    describe('onUpdateSuccess()', function () {
      it("should treat undefined itemIds argument as 'all'", function () {
        GroupStore.onUpdateSuccess(1337, undefined, 'somedata');

        expect(GroupStore.trigger).toHaveBeenCalledTimes(1);
        expect(GroupStore.trigger).toHaveBeenCalledWith(new Set([1, 2, 3]));
      });
    });

    describe('onUpdateError()', function () {
      it("should treat undefined itemIds argument as 'all'", function () {
        GroupStore.onUpdateError(1337, undefined, 'something failed', false);

        expect(GroupStore.trigger).toHaveBeenCalledTimes(1);
        expect(GroupStore.trigger).toHaveBeenCalledWith(new Set([1, 2, 3]));
      });
    });

    describe('onDeleteSuccess()', function () {
      it("should treat undefined itemIds argument as 'all'", function () {
        GroupStore.onDeleteSuccess(1337, undefined, 'somedata');

        expect(GroupStore.trigger).toHaveBeenCalledTimes(1);
        expect(GroupStore.trigger).toHaveBeenCalledWith(new Set([1, 2, 3]));
      });
    });
  });
});
